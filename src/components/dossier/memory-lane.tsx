import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { X } from "lucide-react";
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
  const when = season(age === null ? today() : birthdayAt(active.birthdate, age));
  const inYear = age === null ? null : (counts.get(age) ?? 0);

  return (
    <section
      className="rounded-3xl bg-child-soft p-5 transition-colors duration-300 sm:p-6"
      aria-label="Memory lane"
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="break-words text-[34px] font-bold leading-tight text-ink">
            {active.name}
          </h2>
        </div>
        <div className="grid h-[72px] w-[72px] shrink-0 place-items-end justify-items-center">
          <motion.div
            animate={{ scale: growth }}
            transition={{ type: "spring", stiffness: 180, damping: 18 }}
            style={{ originY: 1 }}
          >
            <Buddy shape={look.shape} color={look.body} size={72} limbs smile />
          </motion.div>
        </div>
      </div>
      <div className="-mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="text-[18px] font-medium leading-snug text-child-ink"
          >
            {age === null ? "Now" : `At ${age}`}
          </motion.p>
        </AnimatePresence>
        <span className="text-ink-2" aria-hidden="true">
          ·
        </span>
        <p className="text-[14px] leading-snug text-ink-2">{when}</p>
      </div>
      <p className="mt-1 text-[13px] text-ink-2">
        {inYear === null
          ? `${cards.length} memories so far`
          : inYear === 0
            ? "No memories kept yet"
            : `${inYear} ${inYear === 1 ? "memory" : "memories"}`}
      </p>

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
        className="memory-lane-range mt-1 block w-full"
        aria-valuetext={label}
      />
      <div
        className="-mt-2 flex justify-between text-[12px] font-medium text-ink-2"
        aria-hidden="true"
      >
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
  const [dismissed, setDismissed] = useState<string[]>([]);
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
    <AnimatePresence>
      {!dismissed.includes(pick.id) && (
        <motion.article
          key={pick.id}
          aria-label="Back then reminder"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.65}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 70 || Math.abs(info.velocity.x) > 450)
              setDismissed((current) => [...current, pick.id]);
          }}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 120, height: 0, margin: 0, padding: 0 }}
          className="relative mx-2 touch-pan-y rounded-2xl bg-paper px-5 pb-5 pt-7 ring-1 ring-line"
        >
          <span
            className="absolute -top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rotate-[3deg] rounded-sm bg-sun-soft/90"
            aria-hidden="true"
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-[14px] text-ink-2">{ago(pick.date)}</p>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-2"
              aria-label="Dismiss memory reminder"
              title="Dismiss reminder"
              onClick={() => setDismissed((current) => [...current, pick.id])}
            >
              <X className="size-4" strokeWidth={1.25} />
            </Button>
          </div>
          <h3 className="text-[21px] font-bold leading-snug text-ink">{pick.title}</h3>
          {pick.body && <p className="mt-2 text-[17px] leading-relaxed text-ink-2">{pick.body}</p>}
        </motion.article>
      )}
    </AnimatePresence>
  );
}
