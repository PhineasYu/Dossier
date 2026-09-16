import { useChildren } from "@/lib/child-context";
import { useTimeline } from "./timeline";

const WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

function spell(count: number) {
  return WORDS[count] ?? String(count);
}

export function StatsLine() {
  const { active } = useChildren();
  const { data: cards = [] } = useTimeline(active?.id ?? null);
  if (!active || !cards.length) return null;

  const oldest = cards[cards.length - 1]!.date;
  const days = Math.max(
    1,
    Math.round((Date.now() - new Date(oldest + "T00:00:00").getTime()) / 86_400_000),
  );
  const dreams = cards.filter((card) => card.category === "dream").length;
  const courage = cards.filter((card) => card.category === "courage").length;
  const fears = cards.filter((card) => card.category === "fear").length;

  return (
    <p className="px-2 py-8 text-center font-display text-lg leading-relaxed text-muted-foreground">
      In {days.toLocaleString("en-GB")} days, you were there for {spell(dreams)}{" "}
      {dreams === 1 ? "change" : "changes"} of dream, {spell(courage)} small{" "}
      {courage === 1 ? "act" : "acts"} of courage and {spell(fears)}{" "}
      {fears === 1 ? "fear" : "fears"} outgrown.
    </p>
  );
}
