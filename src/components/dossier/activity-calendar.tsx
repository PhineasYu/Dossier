import { withAlpha } from "@/lib/dossier";

const WEEKS = 18;

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

/** Sunday-anchored grid of the last WEEKS weeks, GitHub style. */
function buildGrid() {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + (6 - end.getDay()));
  const columns: Date[][] = [];
  for (let w = WEEKS - 1; w >= 0; w -= 1) {
    const column: Date[] = [];
    for (let d = 0; d < 7; d += 1) {
      const day = new Date(end);
      day.setDate(end.getDate() - w * 7 - (6 - d));
      column.push(day);
    }
    columns.push(column);
  }
  return columns;
}

export function ActivityCalendar({
  counts,
  color,
}: {
  counts: Record<string, number>;
  color: string;
}) {
  const columns = buildGrid();
  const today = isoDay(new Date());

  return (
    <div className="paper rounded-3xl border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg">Showing up</h2>
        <p className="text-xs text-muted-foreground">last {WEEKS} weeks</p>
      </div>

      <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
        {columns.map((column, index) => (
          <div key={index} className="flex flex-col gap-1">
            {column.map((day) => {
              const key = isoDay(day);
              const count = counts[key] ?? 0;
              const future = key > today;
              const alpha = count === 0 ? 0.06 : count === 1 ? 0.35 : count === 2 ? 0.6 : 0.9;
              return (
                <div
                  key={key}
                  title={`${key} — ${count} ${count === 1 ? "entry" : "entries"}`}
                  className="size-3 rounded-[3px]"
                  style={{
                    backgroundColor: future ? "transparent" : withAlpha(color, alpha),
                    outline: key === today ? `1px solid ${color}` : undefined,
                    outlineOffset: 1,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        quiet
        {[0.06, 0.35, 0.6, 0.9].map((alpha) => (
          <span
            key={alpha}
            className="size-3 rounded-[3px]"
            style={{ backgroundColor: withAlpha(color, alpha) }}
          />
        ))}
        present
      </div>
    </div>
  );
}

/** Consecutive days up to today (a check-in yesterday keeps the streak alive). */
export function currentStreak(counts: Record<string, number>) {
  const cursor = new Date();
  cursor.setHours(12, 0, 0, 0);
  if (!counts[isoDay(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
    if (!counts[isoDay(cursor)]) return 0;
  }
  let streak = 0;
  while (counts[isoDay(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
