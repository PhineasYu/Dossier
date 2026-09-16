import { motion } from "motion/react";

import { useChildren } from "@/lib/child-context";
import { ageAt, withAlpha } from "@/lib/dossier";

export function ChildSwitcher() {
  const { kids, activeId, setActiveId } = useChildren();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="flex items-center justify-center gap-2" role="group" aria-label="Choose a child">
      {kids.map((kid) => {
        const isActive = kid.id === activeId;
        const age = ageAt(kid.birthdate, today);
        return (
          <button
            key={kid.id}
            type="button"
            onClick={() => setActiveId(kid.id)}
            aria-pressed={isActive}
            className="material-state flex min-h-12 items-center gap-2 rounded-lg border border-line px-3 py-1.5 shadow-none transition-all duration-[400ms] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              borderColor: isActive ? kid.theme_color : "var(--line)",
              backgroundColor: isActive ? withAlpha(kid.theme_color, 0.1) : "transparent",
              opacity: isActive ? 1 : 0.72,
            }}
          >
            <motion.span
              layout
              className="grid size-9 place-items-center rounded-full border-2 border-surface font-display text-lg text-primary-foreground ring-1 ring-line"
              style={{ backgroundColor: kid.theme_color }}
            >
              {kid.name.slice(0, 1)}
            </motion.span>
            <span className="text-left leading-tight">
              <span className="block font-display text-base">{kid.name}</span>
              {age !== null && (
                <span className="block text-xs text-muted-foreground">{age} years</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
