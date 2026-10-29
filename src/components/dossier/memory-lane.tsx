import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, History } from "lucide-react";
import { Button } from "@/components/ui/button";

import { Buddy } from "@/components/dossier/buddy";
import { useChildren } from "@/lib/child-context";
import { ageAt, type MemoryCard } from "@/lib/dossier";
import { useTimeline } from "./timeline";

const today = () => new Date().toISOString().slice(0, 10);

function season(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const name =
    [
      "Winter",
      "Winter",
      "Spring",
      "Spring",
      "Spring",
      "Summer",
      "Summer",
      "Summer",
      "Autumn",
      "Autumn",
      "Autumn",
      "Winter",
    ][d.getMonth()] ?? "Winter";
  return `${name} ${d.getFullYear()}`;
}

/** The date a child turned `age`, as an ISO string. */
function birthdayAt(birthdate: string, age: number) {
  const d = new Date(birthdate + "T00:00:00");
  d.setFullYear(d.getFullYear() + age);
  return d.toISOString().slice(0, 10);
}

/**
 * Travel back through a child's life by age. The buddy shrinks to the size the child
 * was, and the timeline below shows only the memories from that year.
 */
export function MemoryLane({
  age,
  onAgeChange,
}: {
  age: number | null;
  onAgeChange: (age: number | null) => void;
}) {
  const { active, lookOf } = useChildren();
  const look = lookOf(active?.id);
  const { data: cards = [] } = useTimeline(active?.id ?? null);
  const now = ageAt(active?.birthdate ?? null, today());

  const counts = useMemo(() => {
    const map = new Map<number, number>();
    if (!active?.birthdate) return map;
    for (const card of cards) {
      const a = ageAt(active.birthdate, card.date);
      if (a !== null && a >= 0) map.set(a, (map.get(a) ?? 0) + 1);
    }
    return map;
  }, [active?.birthdate, cards]);

  if (!active?.birthdate || now === null || now < 1) return null;

  const stops = now + 1; // ages 0..now, then "Now" at index now + 1
  const value = age === null ? stops : age;
  const shownAge = age ?? now;
  const growth = 0.42 + 0.58 * (shownAge / Math.max(now, 1));
  const label = age === null ? `${active.name} now` : `${active.name} at ${age}`;
  const when =
    age === null
      ? `${counts.size ? cards.length : 0} memories so far`
      : season(birthdayAt(active.birthdate, age));
  const inYear = age === null ? null : (counts.get(age) ?? 0);

  return (
    <section
      className="rounded-3xl bg-child-soft p-5 transition-colors duration-300 sm:p-6"
      aria-label="Memory lane"
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-[34px] font-bold leading-tight text-ink">
            {active.name}
          </h2>
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="mt-2 break-words text-[18px] font-medium leading-snug text-child-ink"
            >
              {age === null ? "Now" : `At ${age}`}
            </motion.p>
          </AnimatePresence>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{when}</p>
          {inYear !== null && (
            <p className="mt-0.5 text-[13px] text-ink-2">
              {inYear === 0
                ? "No memories kept yet"
                : `${inYear} ${inYear === 1 ? "memory" : "memories"}`}
            </p>
          )}
        </div>
        <div className="grid h-[104px] w-[96px] shrink-0 place-items-end justify-items-center">
          <motion.div
            animate={{ scale: growth }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            style={{ originY: 1 }}
          >
            <Buddy shape={look.shape} color={look.body} size={96} limbs smile />
          </motion.div>
        </div>
      </div>

      <label className="sr-only" htmlFor="memory-lane-age">
        Choose an age
      </label>
      <input
        id="memory-lane-age"
        type="range"
        min={0}
        max={stops}
        step={1}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          onAgeChange(next >= stops ? null : next);
        }}
        className="memory-lane-range mt-4 w-full"
        aria-valuetext={label}
      />
      <div className="flex justify-between text-[12px] font-medium text-ink-2" aria-hidden="true">
        {Array.from({ length: stops + 1 }, (_, i) => (
          <span key={i} className={`w-7 text-center ${i === value ? "font-bold text-ink" : ""}`}>
            {i === stops ? "Now" : i}
          </span>
        ))}
      </div>
    </section>
  );
}

function ago(iso: string) {
  const days = Math.round((Date.now() - new Date(iso + "T00:00:00").getTime()) / 86_400_000);
  if (days >= 330 && days <= 400) return "A year ago";
  if (days > 400) return `${Math.round(days / 365)} years ago`;
  return `${Math.round(days / 30)} months ago`;
}

/** One older memory, pinned like a photo, so the past comes to you. */
export function BackThen({ cards }: { cards: MemoryCard[] }) {
  const [open, setOpen] = useState(false);
  const pick = useMemo(() => {
    const now = Date.now();
    const old = cards
      .map((card) => ({
        card,
        days: (now - new Date(card.date + "T00:00:00").getTime()) / 86_400_000,
      }))
      .filter(({ days }) => days >= 150);
    if (!old.length) return null;
    old.sort((a, b) => Math.abs(a.days - 365) - Math.abs(b.days - 365));
    return old[0]?.card ?? null;
  }, [cards]);

  if (!pick) return null;

  return (
    <section aria-label="Back then">
      <Button variant="ghost" onClick={()=>setOpen(value=>!value)} aria-expanded={open} aria-controls="back-then-memory" className="h-auto min-h-14 w-full justify-between gap-3 whitespace-normal rounded-2xl bg-cloud px-4 py-3 text-left">
        <span className="flex min-w-0 items-center gap-3"><History className="shrink-0" aria-hidden="true" /><span className="text-[16px] font-medium text-ink">{ago(pick.date)}</span></span>
        {open ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
      </Button>
      {open && <motion.article id="back-then-memory" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} className="relative mx-2 mt-5 rounded-2xl bg-paper px-5 pb-5 pt-7 ring-1 ring-line">
        <span className="absolute -top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rotate-[3deg] rounded-sm bg-sun-soft/90" aria-hidden="true" />
        <h3 className="text-[21px] font-bold leading-snug text-ink">{pick.title}</h3>
        {pick.body && <p className="mt-2 text-[17px] leading-relaxed text-ink-2">{pick.body}</p>}
      </motion.article>}
    </section>
  );
}
