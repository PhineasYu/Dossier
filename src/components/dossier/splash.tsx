import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { DoorframeScene } from "@/components/dossier/doorframe";
import { Wordmark } from "@/components/dossier/wordmark";

/** The opening moment: the small buddy grows past the pencil marks. Tap to skip. */
export function Splash({ onDone }: { onDone: () => void }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
      onDone();
    }, 1900);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (hidden) return null;

  return (
    <motion.button
      type="button"
      onClick={() => {
        setHidden(true);
        onDone();
      }}
      className="fixed inset-0 z-50 grid w-full place-items-center bg-paper px-8"
      aria-label="Skip intro"
    >
      <SplashConfetti />
      <div className="relative flex w-full max-w-xs flex-col items-center">
        <DoorframeScene grow className="w-full" />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="mt-6"
        >
          <Wordmark className="text-[44px]" />
        </motion.div>
      </div>
    </motion.button>
  );
}

const SHAPES: {
  kind: "dot" | "ring" | "star" | "squiggle" | "blob";
  color: string;
  x: string;
  y: string;
  size: number;
  delay: number;
}[] = [
  { kind: "dot", color: "var(--peach)", x: "12%", y: "16%", size: 44, delay: 0 },
  { kind: "star", color: "var(--ai-spark)", x: "76%", y: "14%", size: 30, delay: 0.2 },
  { kind: "dot", color: "var(--lilac)", x: "82%", y: "46%", size: 16, delay: 0.35 },
  { kind: "ring", color: "var(--sky)", x: "10%", y: "64%", size: 28, delay: 0.3 },
  { kind: "dot", color: "var(--coral)", x: "72%", y: "80%", size: 64, delay: 0.1 },
  { kind: "dot", color: "var(--sun)", x: "24%", y: "88%", size: 12, delay: 0.45 },
];

/** Playful floating shapes behind the opening moment; purely decorative. */
function SplashConfetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {SHAPES.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: shape.x, top: shape.y, width: shape.size, height: shape.size }}
          initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
          animate={{
            opacity: 1,
            scale: 1,
            rotate: [0, 12, -8, 0],
            y: [0, -10, 4, 0],
          }}
          transition={{
            opacity: { delay: shape.delay, duration: 0.4 },
            scale: { delay: shape.delay, type: "spring", stiffness: 260, damping: 14 },
            rotate: { delay: shape.delay, duration: 3.2, repeat: Infinity, ease: "easeInOut" },
            y: { delay: shape.delay, duration: 2.6, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          <ShapeSvg kind={shape.kind} color={shape.color} />
        </motion.div>
      ))}
    </div>
  );
}

function ShapeSvg({ kind, color }: { kind: string; color: string }) {
  if (kind === "dot")
    return <span className="block size-full rounded-full" style={{ background: color }} />;
  if (kind === "ring")
    return (
      <span className="block size-full rounded-full" style={{ border: `3px solid ${color}` }} />
    );
  if (kind === "blob")
    return (
      <svg viewBox="0 0 100 100" className="size-full">
        <path
          d="M52 6c18 0 38 12 40 32s-8 40-28 50S18 92 10 72 4 34 18 20 34 6 52 6z"
          fill={color}
        />
      </svg>
    );
  if (kind === "star")
    return (
      <svg viewBox="0 0 24 24" className="size-full">
        <path
          d="M12 1.5l2.4 7.1 7.1 2.4-7.1 2.4L12 20.5l-2.4-7.1L2.5 11l7.1-2.4z"
          fill={color}
          stroke="var(--ai-spark-line)"
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
      </svg>
    );
  return (
    <svg viewBox="0 0 60 20" className="size-full" fill="none">
      <path
        d="M2 12c6-10 10-10 14 0s8 10 14 0 8-10 14 0 8 10 14 0"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
