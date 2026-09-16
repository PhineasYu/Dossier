import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";

import { supabase } from "@/integrations/supabase/client";
import { useChildren } from "@/lib/child-context";
import type { MemoryCard } from "@/lib/dossier";
import { MemoryCardView } from "./memory-card";

export function useTimeline(childId: string | null) {
  return useQuery({
    queryKey: ["cards", childId],
    enabled: Boolean(childId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cards")
        .select("id, child_id, entry_id, date, title, body, category")
        .eq("child_id", childId!)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MemoryCard[];
    },
  });
}

export function Timeline() {
  const { active } = useChildren();
  const { data: cards = [], isLoading } = useTimeline(active?.id ?? null);
  const accent = active?.theme_color ?? "var(--primary)";

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Opening the archive…</p>;
  }

  if (!cards.length) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Nothing here yet. Talk to Dossier and the first memory appears.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.04, 0.4), duration: 0.35 }}
        >
          <MemoryCardView card={card} accent={accent} />
        </motion.div>
      ))}
    </div>
  );
}
