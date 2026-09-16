import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { AddTodayBar, BottomNav } from "@/components/dossier/bottom-nav";
import { AppHeader } from "@/components/dossier/app-header";
import { Splash } from "@/components/dossier/splash";
import { StatsLine } from "@/components/dossier/stats-line";
import { Timeline } from "@/components/dossier/timeline";
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
          "Dossier turns everyday moments into each child's growth timeline and living profile. Just talk, and it sorts the rest.",
      },
      { property: "og:title", content: "Dossier — your child's lifelong story" },
      {
        property: "og:description",
        content:
          "Speak freely about your day. Dossier files the memories and the facts for every child.",
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
  const { active } = useChildren();
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/app" });

  return (
    <div className="flex min-h-screen flex-col">
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}

      <AppHeader />
      <AddTodayBar />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-8">
        <VoiceCheckin />
        <h1 className="pt-7 pb-4 font-display text-2xl">
          {active ? `${active.name}'s story so far` : "The archive"}
        </h1>
        <ArchiveSearch
          scope="timeline"
          query={q ?? ""}
          onQueryChange={(value) => navigate({ search: (previous) => ({ ...previous, q: value || undefined }), replace: true })}
          onTimelineMatches={setSmartCardIds}
        />
        <div className="mt-4">
          <Timeline query={q ?? ""} {...(smartCardIds ? { smartCardIds } : {})} />
        </div>
        <StatsLine />
      </main>

      <BottomNav />
    </div>
  );
}
