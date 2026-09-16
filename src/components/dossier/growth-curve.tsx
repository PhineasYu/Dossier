import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { formatDate, type ProfileFact } from "@/lib/dossier";

export function GrowthCurve({
  heights,
  weights,
  accent,
}: {
  heights: ProfileFact[];
  weights: ProfileFact[];
  accent: string;
}) {
  const points = [...heights]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((fact) => {
      const weight = [...weights]
        .sort((a, b) => a.date.localeCompare(b.date))
        .filter((w) => w.date <= fact.date)
        .at(-1);
      return {
        date: fact.date,
        label: fact.date.slice(0, 7),
        height: Number(fact.value),
        weight: weight ? Number(weight.value) : null,
      };
    });

  const latestHeight = points.at(-1);
  const latestWeight = [...weights].sort((a, b) => a.date.localeCompare(b.date)).at(-1);

  return (
    <div className="material-card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="font-display text-lg">Pencil marks</h3>
        <p className="text-sm text-muted-foreground">
          {latestHeight ? `${latestHeight.height} cm` : "—"}
          {latestWeight ? ` · ${latestWeight.value} kg` : ""}
        </p>
      </div>
      {points.length > 1 ? (
        <div className="mt-4 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <YAxis
                domain={["dataMin - 6", "dataMax + 6"]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                stroke="var(--border)"
              />
              <Line
                type="monotone"
                dataKey="height"
                stroke={accent}
                strokeWidth={2.5}
                dot={{ r: 3, fill: accent }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          One measurement so far. Say a new height out loud and the line starts.
        </p>
      )}
      {latestHeight && (
        <p className="mt-2 text-xs text-muted-foreground">
          Last measured {formatDate(latestHeight.date)}
        </p>
      )}
    </div>
  );
}
