import { motion } from "motion/react";

export function GrowingFamily() {
  return (
    <div className="flex h-72 items-end justify-center gap-7" aria-label="A child growing taller beside their parent">
      <svg width="82" height="248" viewBox="0 0 82 248" aria-hidden="true">
        <circle cx="41" cy="28" r="24" fill="var(--foreground)" />
        <path
          d="M41 57C21 57 8 70 8 90v158h66V90C74 70 61 57 41 57Z"
          fill="var(--foreground)"
        />
      </svg>

      <motion.svg
        width="68"
        height="248"
        viewBox="0 0 68 248"
        aria-hidden="true"
        animate={{ scaleY: [0.34, 0.54, 0.76, 1.07, 0.34] }}
        transition={{ duration: 5.5, ease: "easeInOut", repeat: Infinity, times: [0, 0.28, 0.56, 0.82, 1] }}
        style={{ originY: 1, color: "var(--child)" }}
      >
        <circle cx="34" cy="27" r="22" fill="currentColor" />
        <path d="M34 54C17 54 6 65 6 82v166h56V82C62 65 51 54 34 54Z" fill="currentColor" />
      </motion.svg>
    </div>
  );
}