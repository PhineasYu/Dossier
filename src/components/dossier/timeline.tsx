import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { filterMemories } from "@/lib/memory-filters";

import { supabase } from "@/integrations/supabase/client";
import { useChildren } from "@/lib/child-context";
import { CATEGORY_LABEL, type MemoryCard } from "@/lib/dossier";
import { MemoryCardView } from "./memory-card";

export function useTimeline(childId: string | null) {
  return useQuery({
    queryKey: ["cards", childId],
    enabled: Boolean(childId),
    queryFn: async () => {
      if (!childId) return [];
      const { data, error } = await supabase
        .from("cards")
        .select("id, child_id, entry_id, date, title, body, category, question_origin")
        .eq("child_id", childId)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MemoryCard[];
    },
  });
}

export function Timeline({
  query = "",
  smartCardIds,
  age = null,
  category = null,
  onCategoryChange,
}: {
  query?: string;
  smartCardIds?: string[];
  /** Only show memories from the year the child was this age. */
  age?: number | null;
  category?: string | null;
  onCategoryChange?: ((category: string | null) => void) | undefined;
}) {
  const { active } = useChildren();
  const { data: cards = [], isLoading } = useTimeline(active?.id ?? null);
  const filteredCards = filterMemories(cards, {
    query,
    smartCardIds,
    age,
    category,
    birthdate: active?.birthdate,
  });
  const categories = [...new Set(cards.map((card) => card.category))];

  if (isLoading) {
    return <p className="py-10 text-center text-[15px] text-ink-3">Opening the story…</p>;
  }

  if (!cards.length) {
    return (
      <div className="tile px-6 py-10 text-center">
        <p className="text-lg font-bold">No memories yet</p>
        <p className="mx-auto mt-1 max-w-xs text-[15px] text-ink-2">
          Answer tonight&apos;s two questions and the first card appears here.
        </p>
      </div>
    );
  }

  return (
    <section className="space-y-3" aria-label="Memories">
      {onCategoryChange && (
        <div className="space-y-2 pb-1">
          <div className="flex items-center justify-between gap-3 text-[13px] text-ink-2">
            <span className="flex items-center gap-1.5 font-medium">
              <ListFilter className="size-4" aria-hidden="true" /> Filter memories
            </span>
            <span role="status">
              {filteredCards.length} {filteredCards.length === 1 ? "memory" : "memories"}
            </span>
          </div>
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Filter memories by category"
          >
            {[null, ...categories].map((value) => (
              <Button
                key={value ?? "all"}
                variant={category === value ? "default" : "secondary"}
                className="h-11 px-3.5 text-[13px] capitalize"
                aria-pressed={category === value}
                onClick={() => onCategoryChange(value)}
              >
                {value ? (CATEGORY_LABEL[value] ?? value) : "All"}
              </Button>
            ))}
          </div>
        </div>
      )}
      {!filteredCards.length && (
        <div className="py-8 text-center">
          <p className="text-[15px] text-ink-2">No memories match these filters.</p>
          {category && onCategoryChange && (
            <Button variant="ghost" className="mt-2" onClick={() => onCategoryChange(null)}>
              Clear category
            </Button>
          )}
        </div>
      )}
      {filteredCards.map((card, index) => (
        <motion.div
          key={card.id}
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: smartCardIds ? Math.min(index * 0.055, 0.22) : 0, duration: 0.25 }}
        >
          <MemoryCardView card={card} onCategoryChange={onCategoryChange} preview={index === 0 ? "photo" : index === 1 ? "audio" : index === 3 ? "art" : undefined} />
        </motion.div>
      ))}
    </section>
  );
}
