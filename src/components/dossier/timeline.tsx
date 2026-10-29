import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";

import { supabase } from "@/integrations/supabase/client";
import { useChildren } from "@/lib/child-context";
import { ageAt, type MemoryCard } from "@/lib/dossier";
import { MemoryCardView } from "./memory-card";

export function useTimeline(childId: string | null) {
  return useQuery({
    queryKey: ["cards", childId],
    enabled: Boolean(childId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("id, child_id, entry_id, date, title, body, category, question_origin")
        .eq("child_id", childId!)
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
}: {
  query?: string;
  smartCardIds?: string[];
  /** Only show memories from the year the child was this age. */
  age?: number | null;
}) {
  const { active } = useChildren();
  const { data: cards = [], isLoading } = useTimeline(active?.id ?? null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredCards = cards.filter((card) => {
    if (age !== null && ageAt(active?.birthdate ?? null, card.date) !== age) return false;
    if (smartCardIds) return smartCardIds.includes(card.id);
    if (!normalizedQuery) return true;
    return [card.title, card.body ?? "", card.category, card.date]
      .join(" ")
      .toLocaleLowerCase()
      .includes(normalizedQuery);
  });

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

  if (!filteredCards.length) {
    return (
      <p className="py-10 text-center text-[15px] text-ink-3">
        Nothing in the story matches that. Try another word.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {filteredCards.map((card, index) => (
        <motion.div
          key={card.id}
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: smartCardIds ? index * 0.4 : 0, duration: 0.35 }}
        >
          <MemoryCardView card={card} />
        </motion.div>
      ))}
    </div>
  );
}
