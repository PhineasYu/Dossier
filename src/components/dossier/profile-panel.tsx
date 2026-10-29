import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { useChildren } from "@/lib/child-context";
import { FIELD_LABEL, shortDate, type ProfileFact } from "@/lib/dossier";
import { GrowthCurve } from "./growth-curve";
import { TriangleAlert } from "lucide-react";

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

function FactList({
  rows,
  title,
  danger = false,
  tint = "bg-cloud",
}: {
  rows: FactRow[];
  title: string;
  danger?: boolean;
  tint?: string;
}) {
  if (!rows.length) return null;
  return (
    <section className={`rounded-3xl p-5 ${danger ? "bg-danger-soft" : tint}`}>
      <h2
        className={`flex items-center gap-2 text-lg font-bold ${danger ? "text-danger" : "text-ink"}`}
      >
        {danger && <TriangleAlert className="size-5" aria-hidden="true" />}
        {title}
      </h2>
      <ul className={`mt-2 divide-y-[1.5px] ${danger ? "divide-[#f9d3cf]" : "divide-paper/80"}`}>
        {rows.map((row) => (
          <li
            key={row.id}
            className={`-mx-2 flex items-baseline justify-between gap-4 rounded-xl px-2 py-3 ${isFresh(row) ? "fact-glow" : ""}`}
          >
            <span className={`text-[15px] ${danger ? "font-semibold text-danger" : "text-ink-2"}`}>
              {FIELD_LABEL[row.field] ?? row.field}
            </span>
            <span className="flex-1 text-right">
              <span className="text-[15px] font-semibold text-ink">{row.value}</span>
              {isFresh(row) && (
                <span className="ml-2 rounded-full bg-action px-2 py-0.5 text-[11px] font-bold text-on-action">
                  New
                </span>
              )}
              <span className="block text-[12px] text-ink-3">{shortDate(row.date)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProfilePanel({ query = "" }: { query?: string }) {
  const { active, lookOf } = useChildren();
  const { data: facts = [], isLoading } = useFacts(active?.id ?? null);
  const look = lookOf(active?.id);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleFacts = normalizedQuery
    ? facts.filter((fact) =>
        [FIELD_LABEL[fact.field] ?? fact.field, fact.value, fact.date]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
    : facts;

  if (isLoading) {
    return <p className="py-10 text-center text-[15px] text-ink-3">Opening the file…</p>;
  }

  const pick = (...fields: string[]) => visibleFacts.filter((fact) => fields.includes(fact.field));

  return (
    <div className="space-y-3">
      <FactList rows={pick("allergy", "medical")} title="Allergies & medical" danger />
      <GrowthCurve
        heights={pick("height")}
        weights={pick("weight")}
        look={look}
        name={active?.name ?? "Your child"}
      />
      <FactList rows={pick("wellbeing")} title="Feelings lately" tint="bg-lilac-soft" />
      <FactList rows={pick("school")} title="From school" tint="bg-sky-soft" />
      <FactList rows={pick("food_like", "food_dislike")} title="Food" tint="bg-tomato-soft" />
      <FactList rows={pick("interest")} title="Interests" tint="bg-aqua-soft" />
      <FactList rows={pick("friend")} title="Friends" tint="bg-bubblegum-soft" />
      {normalizedQuery && !visibleFacts.length && (
        <p className="py-6 text-center text-[15px] text-ink-3">
          Nothing in the file matches that. Try another word.
        </p>
      )}
    </div>
  );
}
