import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { supabase } from "@/integrations/supabase/client";
import { useChildren } from "@/lib/child-context";
import { FIELD_LABEL, shortDate, type ProfileFact } from "@/lib/dossier";
import { GrowthCurve } from "./growth-curve";
import { ChevronDown, TriangleAlert } from "lucide-react";

type FactRow = ProfileFact & { created_at: string };

export function useFacts(childId: string | null) {
  return useQuery({
    queryKey: ["facts", childId],
    enabled: Boolean(childId),
    queryFn: async () => {
      if (!childId) return [];
      const { data, error } = await supabase
        .from("profile_facts")
        .select("id, child_id, entry_id, field, value, date, created_at")
        .eq("child_id", childId)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as FactRow[];
    },
  });
}

function isFresh(row: FactRow) {
  return Date.now() - new Date(row.created_at).getTime() < 90_000;
}

function FactRows({ rows }: { rows: FactRow[] }) {
  return (
    <ul className="divide-y divide-paper/80">
      {rows.map((row) => (
        <li key={row.id} className={`py-3 ${isFresh(row) ? "fact-glow" : ""}`}>
          <p className="break-words text-[17px] font-semibold leading-relaxed text-ink">
            {row.value}
            {isFresh(row) && (
              <span className="ml-2 rounded-full bg-action px-2 py-0.5 text-[11px] font-bold text-on-action">
                New
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[12px] text-ink-2">{shortDate(row.date)}</p>
        </li>
      ))}
    </ul>
  );
}

function FactGroup({
  rows,
  title,
  forceOpen,
}: {
  rows: FactRow[];
  title: string;
  forceOpen: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!rows.length) return null;
  return (
    <Collapsible
      open={forceOpen || open}
      onOpenChange={setOpen}
      className="border-t border-paper/80"
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="group h-auto min-h-11 w-full justify-between rounded-lg px-0 py-2 text-left hover:bg-transparent"
        >
          <span className="flex min-w-0 items-center gap-2 whitespace-normal text-[17px] text-ink">
            {title}
            <span className="text-[14px] font-normal text-ink-2">{rows.length}</span>
          </span>
          <ChevronDown
            aria-hidden="true"
            strokeWidth={1.25}
            className="transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <FactRows rows={rows} />
      </CollapsibleContent>
    </Collapsible>
  );
}

function FactList({
  rows,
  title,
  danger = false,
  tint = "bg-cloud",
  forceOpen = false,
  groupFood = false,
}: {
  rows: FactRow[];
  title: string;
  danger?: boolean;
  tint?: string;
  forceOpen?: boolean;
  groupFood?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (!rows.length) return null;
  if (danger) {
    return (
      <section className="rounded-3xl bg-danger-soft p-5" aria-label={title}>
        <h2 className="flex items-center gap-2 text-[24px] font-bold text-danger">
          <TriangleAlert className="size-5 shrink-0" aria-hidden="true" />
          {title}
        </h2>
        <FactRows rows={rows} />
      </section>
    );
  }
  const expanded = forceOpen || open;
  return (
    <section className={`rounded-3xl px-5 py-3 ${tint}`} aria-label={title}>
      <Collapsible open={expanded} onOpenChange={setOpen}>
        <h2>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className="group h-auto min-h-11 w-full justify-between rounded-lg px-0 py-1 text-left hover:bg-transparent"
            >
              <span className="flex min-w-0 items-baseline gap-2 whitespace-normal">
                <span className="text-[24px] font-bold leading-tight text-ink">{title}</span>
                <span className="text-[14px] font-normal text-ink-2">{rows.length}</span>
              </span>
              <ChevronDown
                aria-hidden="true"
                strokeWidth={1.25}
                className="transition-transform group-data-[state=open]:rotate-180 motion-reduce:transition-none"
              />
            </Button>
          </CollapsibleTrigger>
        </h2>
        {!expanded && (
          <p className="truncate pb-1 text-[15px] text-ink-2">
            {rows
              .slice(0, 2)
              .map((row) => row.value)
              .join(" · ")}
          </p>
        )}
        <CollapsibleContent>
          {groupFood ? (
            <div className="mt-2">
              <FactGroup
                rows={rows.filter((row) => row.field === "food_like")}
                title="Loves eating"
                forceOpen={forceOpen}
              />
              <FactGroup
                rows={rows.filter((row) => row.field === "food_dislike")}
                title="Won't eat"
                forceOpen={forceOpen}
              />
            </div>
          ) : (
            <FactRows rows={rows} />
          )}
        </CollapsibleContent>
      </Collapsible>
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
    <div key={`${active?.id ?? "none"}:${normalizedQuery}`} className="space-y-3">
      <FactList rows={pick("allergy", "medical")} title="Allergies & medical" danger />
      <GrowthCurve
        heights={pick("height")}
        weights={pick("weight")}
        look={look}
        name={active?.name ?? "Your child"}
      />
      <FactList
        rows={pick("wellbeing")}
        title="Feelings lately"
        tint="bg-lilac-soft"
        forceOpen={Boolean(normalizedQuery)}
      />
      <FactList
        rows={pick("school")}
        title="From school"
        tint="bg-sky-soft"
        forceOpen={Boolean(normalizedQuery)}
      />
      <FactList
        rows={pick("food_like", "food_dislike")}
        title="Food"
        tint="bg-sage-soft"
        groupFood
        forceOpen={Boolean(normalizedQuery)}
      />
      <FactList
        rows={pick("interest")}
        title="Interests"
        tint="bg-aqua-soft"
        forceOpen={Boolean(normalizedQuery)}
      />
      <FactList
        rows={pick("friend")}
        title="Friends"
        tint="bg-bubblegum-soft"
        forceOpen={Boolean(normalizedQuery)}
      />
      {normalizedQuery && !visibleFacts.length && (
        <p className="py-6 text-center text-[15px] text-ink-3">
          Nothing in the file matches that. Try another word.
        </p>
      )}
    </div>
  );
}
