import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
        className="flex items-center gap-2 rounded-full border bg-card px-4 py-2"
      >
        <Search className="size-4 text-muted-foreground" />
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={`Ask anything about ${active?.name ?? "your child"}…`}
          className="flex-1 bg-transparent py-1.5 text-sm outline-none"
        />
        <button
          type="submit"
          disabled={isAsking || !question.trim()}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: "var(--child)" }}
        >
          {isAsking ? <Loader2 className="size-3.5 animate-spin" /> : "Ask"}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => {
              setQuestion(example);
              ask(example);
            }}
            className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground"
          >
            {example}
          </button>
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
