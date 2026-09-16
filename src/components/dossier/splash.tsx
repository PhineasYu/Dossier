import { motion } from "motion/react";
import { useEffect, useState } from "react";

export function Splash({ onDone }: { onDone: () => void }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHidden(true);
      onDone();
    }, 1800);
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
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid w-full place-items-center bg-background"
      aria-label="Skip intro"
    >
      <div className="flex flex-col items-center">
        <div className="flex h-64 items-end gap-6">
          {/* Parent */}
          <svg width="76" height="220" viewBox="0 0 76 220" aria-hidden="true">
            <circle cx="38" cy="26" r="22" fill="var(--foreground)" />
            <path d="M38 52c-18 0-30 12-30 30v138h60V82c0-18-12-30-30-30z" fill="var(--foreground)" />
          </svg>
          {/* Child grows past the parent */}
          <motion.svg
            width="62"
            height="220"
            viewBox="0 0 62 220"
            aria-hidden="true"
            initial={{ scaleY: 0.34 }}
            animate={{ scaleY: [0.34, 0.55, 0.78, 1.06] }}
             transition={{ duration: 1.35, ease: "easeInOut", times: [0, 0.35, 0.7, 1] }}
            style={{ originY: 1, color: "var(--child)" }}
          >
            <circle cx="31" cy="24" r="20" fill="currentColor" />
            <path d="M31 48c-15 0-25 10-25 25v147h50V73c0-15-10-25-25-25z" fill="currentColor" />
          </motion.svg>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
           transition={{ delay: 0.9, duration: 0.45 }}
          className="mt-8 text-center"
        >
          <h1 className="font-display text-3xl">Dossier</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyday moments, kept as their lifelong story
          </p>
        </motion.div>
      </div>
    </motion.button>
  );
}
