import { GrowthDoorframe } from "@/components/dossier/doorframe";
import { shortDate, type ProfileFact } from "@/lib/dossier";
import type { ChildLook } from "@/lib/palette";

/** Height and weight, drawn as pencil marks on a doorframe. */
export function GrowthCurve({
  heights,
  weights,
  look,
  name,
}: {
  heights: ProfileFact[];
  weights: ProfileFact[];
  look: ChildLook;
  name: string;
}) {
  const marks = heights
    .map((fact) => ({ cm: Number(fact.value), date: fact.date }))
    .filter((mark) => Number.isFinite(mark.cm));
  const latestHeight = [...marks].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  const latestWeight = [...weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  if (!latestHeight && !latestWeight) return null;

  return (
    <section className="rounded-3xl bg-child-soft p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">Pencil marks</h2>
        <p className="text-[15px] font-semibold text-ink">
          {latestHeight ? `${latestHeight.cm} cm` : ""}
          {latestHeight && latestWeight ? " · " : ""}
          {latestWeight ? `${latestWeight.value} kg` : ""}
        </p>
      </div>
      {marks.length > 0 ? (
        <div className="mt-2">
          <GrowthDoorframe marks={marks} look={look} name={name} />
        </div>
      ) : (
        <p className="mt-2 text-[15px] text-ink-2">
          Say a height out loud and the first mark appears.
        </p>
      )}
      {latestHeight && (
        <p className="mt-1 text-[13px] text-ink-3">Last measured {shortDate(latestHeight.date)}</p>
      )}
    </section>
  );
}
