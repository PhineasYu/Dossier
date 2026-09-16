import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useChildren } from "@/lib/child-context";
import { FIELD_LABEL, formatDate, type ProfileFact } from "@/lib/dossier";
import { GrowthCurve } from "./growth-curve";

type FactRow = ProfileFact & { created_at: string };

export function useFacts(childId: string | null) {
  return useQuery({
    queryKey: ["facts", childId],
    enabled: Boolean(childId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profile_facts")
        .select("id, child_id, entry_id, field, value, date, created_at")
        .eq("child_id", childId!)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as FactRow[];
    },
  });
}

function isFresh(row: FactRow) {
  return Date.now() - new Date(row.created_at).getTime() < 90_000;
}

function FactList({ rows, title }: { rows: FactRow[]; title: string }) {
  if (!rows.length) return null;
  return (
    <div className="paper rounded-2xl border bg-card p-5">
      <h3 className="font-display text-lg">{title}</h3>
      <ul className="mt-3 divide-y">
        {rows.map((row) => (
          <li
            key={row.id}
            className={`flex items-baseline justify-between gap-3 rounded-lg px-1 py-2.5 text-sm ${
              isFresh(row) ? "fact-glow" : ""
            }`}
          >
            <span className="text-muted-foreground">{FIELD_LABEL[row.field] ?? row.field}</span>
            <span className="flex-1 text-right">
              {row.value}
              {isFresh(row) && (
                <span
                  className="ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide"
                  style={{ backgroundColor: "var(--child-soft)", color: "var(--child)" }}
                >
                  new
                </span>
              )}
              <span className="block text-[11px] text-muted-foreground">
                {formatDate(row.date)}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProfilePanel() {
  const { active } = useChildren();
  const { data: facts = [], isLoading } = useFacts(active?.id ?? null);
  const accent = active?.theme_color ?? "#c2703d";

  if (isLoading) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Opening the file…</p>;
  }

  const pick = (...fields: string[]) => facts.filter((fact) => fields.includes(fact.field));

  return (
    <div className="space-y-3">
      <FactList rows={pick("allergy", "medical")} title="Allergies & medical" />
      <GrowthCurve heights={pick("height")} weights={pick("weight")} accent={accent} />
      <FactList rows={pick("food_like", "food_dislike")} title="Food" />
      <FactList rows={pick("interest")} title="Interests" />
      <FactList rows={pick("friend")} title="Friends" />
    </div>
  );
}
