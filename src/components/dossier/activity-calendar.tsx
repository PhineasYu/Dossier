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

const LEVELS = [
  "var(--cloud-2)",
  "color-mix(in srgb, var(--child) 40%, white)",
  "color-mix(in srgb, var(--child) 70%, white)",
  "var(--child)",
];

function level(count: number) {
  return count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
}

/** Every evening a parent showed up, GitHub style, in the active child's crayon. */
export function ActivityCalendar({ counts }: { counts: Record<string, number> }) {
  const columns = buildGrid();
  const today = isoDay(new Date());
  const shown = Object.entries(counts).filter(([day]) => day >= isoDay(columns[0]![0]!)).length;

  return (
    <section className="tile p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">Days with a memory</h2>
        <p className="text-[13px] text-ink-3">
          {shown} in {WEEKS} weeks
        </p>
      </div>

      <div
        className="mt-4 flex gap-[3px] overflow-x-auto pb-1"
        role="img"
        aria-label={`${shown} evenings with an entry in the last ${WEEKS} weeks`}
      >
        {columns.map((column, index) => (
          <div key={index} className="flex flex-col gap-[3px]">
            {column.map((day) => {
              const key = isoDay(day);
              const count = counts[key] ?? 0;
              const future = key > today;
              return (
                <div
                  key={key}
                  title={`${key}: ${count} ${count === 1 ? "entry" : "entries"}`}
                  className="size-[13px] rounded-[4px]"
                  style={{
                    backgroundColor: future ? "transparent" : LEVELS[level(count)],
                    outline: key === today ? "1.5px solid var(--ink)" : undefined,
                    outlineOffset: 1,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </section>
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
