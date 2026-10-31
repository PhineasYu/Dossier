import { AnimatePresence, motion } from "motion/react";
import { Shuffle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export type Prompt = {
  text: string;
  /** Set for the two original questions so their memories keep the question chip. */
  origin?: "for_child" | "child_moment";
};

/**
 * Optional nudges for the evenings a parent doesn't know where to start. The two
 * founding questions are cards 1 and 2; the rest cover feelings, school, food and sleep,
 * because the family's context is more than milestones.
 */
export const PROMPTS: Prompt[] = [
  { text: "What did you do for your kids today?", origin: "for_child" },
  { text: "What did your kids do today that you want to remember?", origin: "child_moment" },
  { text: "What made them laugh today?" },
  { text: "Did anything worry them this week?" },
  { text: "Something they said that you never want to forget?" },
  { text: "Who did they play with today?" },
  { text: "Anything the teacher mentioned?" },
  { text: "What did they eat, or refuse to eat?" },
  { text: "How did everyone sleep last night?" },
  { text: "What are they into right now?" },
];

const TINTS = [
  "bg-sun-soft",
  "bg-sky-soft",
  "bg-lilac-soft",
  "bg-bubblegum-soft",
  "bg-peach-soft",
  "bg-tomato-soft",
];

/** A small stack of prompt cards. Shuffle to draw another; "Use this" hands it to capture. */
export function PromptDeck({ onUse }: { onUse: (prompt: Prompt) => void }) {
  const [index, setIndex] = useState(() => new Date().getDate() % PROMPTS.length);
  const [direction, setDirection] = useState(1);
  const prompt = PROMPTS[index % PROMPTS.length]!;
  const next = () => {
    setDirection((value) => -value);
    setIndex((value) => (value + 1) % PROMPTS.length);
  };

  return (
    <section aria-label="Prompt cards">
      <div className="relative h-[176px]">
        {/* the two cards waiting underneath */}
        <div
          className={`absolute inset-x-3 top-3 h-[160px] rotate-[-3deg] rounded-3xl ${TINTS[(index + 2) % TINTS.length]}`}
        />
        <div
          className={`absolute inset-x-1.5 top-1.5 h-[160px] rotate-[2deg] rounded-3xl ${TINTS[(index + 1) % TINTS.length]}`}
        />
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.article
            key={index}
            initial={{ opacity: 0, y: 14, rotate: direction * 3, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * 220, rotate: direction * 14 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={`absolute inset-x-0 top-0 flex h-[160px] flex-col justify-between rounded-3xl p-5 ${TINTS[index % TINTS.length]}`}
          >
            <p className="display text-balance text-[26px] text-ink">{prompt.text}</p>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="ai" onClick={() => onUse(prompt)}>
                Answer this
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={next}
                aria-label="Draw another card"
              >
                <Shuffle /> Another
              </Button>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>
    </section>
  );
}
