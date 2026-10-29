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
      <div className="flex w-full max-w-xs flex-col items-center">
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
