import { motion } from "motion/react";

import { Buddy } from "@/components/dossier/buddy";
import { useChildren } from "@/lib/child-context";
import { ageAt } from "@/lib/dossier";

/** One buddy per child. The chosen child's crayon recolours the app. */
export function ChildSwitcher() {
  const { kids, activeId, setActiveId, lookOf } = useChildren();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1"
      role="group"
      aria-label="Choose a child"
    >
      {kids.map((kid) => {
        const isActive = kid.id === activeId;
        const age = ageAt(kid.birthdate, today);
        const look = lookOf(kid.id);
        return (
          <button
            key={kid.id}
            type="button"
            onClick={() => setActiveId(kid.id)}
            aria-pressed={isActive}
            className="press flex shrink-0 items-center gap-2.5 rounded-full py-1.5 pl-1.5 pr-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-ink"
            style={{ backgroundColor: isActive ? look.soft : "transparent" }}
          >
            <motion.span
              key={isActive ? "on" : "off"}
              animate={isActive ? { y: [0, -7, 0] } : { y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              style={{ opacity: isActive ? 1 : 0.6 }}
            >
              <Buddy shape={look.shape} color={look.body} size={40} />
            </motion.span>
            <span className="leading-tight">
              <span
                className={`block text-[15px] font-semibold ${isActive ? "text-ink" : "text-ink-2"}`}
              >
                {kid.name}
              </span>
              {age !== null && <span className="block text-xs text-ink-3">{age} years old</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
