import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { BottomNav } from "@/components/dossier/bottom-nav";
import { AppHeader } from "@/components/dossier/app-header";
import { Splash } from "@/components/dossier/splash";
import { StatsLine } from "@/components/dossier/stats-line";
import { Timeline, useTimeline } from "@/components/dossier/timeline";
import { BackThen, MemoryLane } from "@/components/dossier/memory-lane";
import { VoiceCheckin } from "@/components/dossier/voice-checkin";
import { ArchiveSearch } from "@/components/dossier/archive-search";
import { useChildren } from "@/lib/child-context";

export const Route = createFileRoute("/_authenticated/app")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search["q"] === "string" ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Dossier — your child's lifelong story" },
      {
        name: "description",
        content:
          "Capture and search everyday memories in your child's growth timeline, with every meaningful moment kept in one place.",
      },
      { property: "og:title", content: "Dossier — your child's lifelong story" },
      {
        property: "og:description",
        content: "Speak freely, then search every memory in your child's growing story.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [smartCardIds, setSmartCardIds] = useState<string[] | undefined>();
  const [age, setAge] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const { active } = useChildren();
  const { data: cards = [] } = useTimeline(active?.id ?? null);
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/app" });

  useEffect(() => {
    setAge(null);
    setCategory(null);
    setSmartCardIds(undefined);
  }, [active?.id]);

  return (
    <div className="flex min-h-screen flex-col">
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}

      <AppHeader />

      <main className="mx-auto w-full max-w-xl flex-1 space-y-5 px-5 pb-32 sm:px-6">
        <h1 className="display break-words pb-1 pt-5 text-[44px] text-ink">
          {active ? `${active.name}\u2019s story` : "The story"}
        </h1>
        <MemoryLane age={age} onAgeChange={setAge} />
        {age === null && !q && !category && <BackThen cards={cards} />}
        <VoiceCheckin />
        <ArchiveSearch
          scope="timeline"
          query={q ?? ""}
          onQueryChange={(value) =>
            navigate({
              search: (previous) => ({ ...previous, q: value || undefined }),
              replace: true,
            })
          }
          onTimelineMatches={setSmartCardIds}
        />
        <Timeline query={q ?? ""} age={age} category={category} onCategoryChange={setCategory} {...(smartCardIds ? { smartCardIds } : {})} />
        <StatsLine />
      </main>

      <BottomNav />
    </div>
  );
}
