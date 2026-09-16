import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useChildren } from "@/lib/child-context";
import { askArchive } from "@/lib/dossier.functions";
import type { MemoryCard } from "@/lib/dossier";
import { MemoryCardView } from "./memory-card";
import { useTimeline } from "./timeline";

const EXAMPLES = [
  "What was he afraid of when he was 3?",
  "When was she brave?",
  "What did she want to be?",
];

export function AskPanel() {
  const { active } = useChildren();
  const { data: cards = [] } = useTimeline(active?.id ?? null);
  const run = useServerFn(askArchive);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [matches, setMatches] = useState<MemoryCard[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const ask = async (value: string) => {
    if (!value.trim() || !active) return;
    setIsAsking(true);
    setMatches([]);
    setAnswer("");
    try {
      const result = await run({ data: { question: value, childId: active.id } });
      setAnswer(result.answer);
      const byId = new Map(cards.map((card) => [card.id, card]));
      setMatches(
        result.cardIds
          .map((id) => byId.get(id))
          .filter((card): card is MemoryCard => Boolean(card))
          .sort((a, b) => b.date.localeCompare(a.date)),
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not search the archive.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <section className="space-y-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(question);
        }}
        className="flex min-h-14 items-center gap-2 rounded-full bg-surface-container-high px-4 shadow-[var(--elevation-1)] focus-within:ring-2 focus-within:ring-ring"
      >
        <Search className="size-4 text-muted-foreground" />
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={`Ask anything about ${active?.name ?? "your child"}…`}
          className="flex-1 bg-transparent py-1.5 text-sm outline-none"
        />
        <Button
          type="submit"
          disabled={isAsking || !question.trim()}
          size="sm"
          className="bg-child text-primary-foreground"
        >
          {isAsking ? <Loader2 className="size-3.5 animate-spin" /> : "Ask"}
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <Button
            key={example}
            type="button"
            onClick={() => {
              setQuestion(example);
              ask(example);
            }}
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs text-on-surface-variant"
          >
            {example}
          </Button>
        ))}
      </div>

      {answer && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="px-1 font-display text-lg leading-relaxed"
        >
          {answer}
        </motion.p>
      )}

      <div className="space-y-3">
        {matches.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.4, duration: 0.5, ease: "easeOut" }}
          >
            <MemoryCardView card={card} accent={active?.theme_color ?? "#c2703d"} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
