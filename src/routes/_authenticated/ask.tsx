import { createFileRoute } from "@tanstack/react-router";

import { AskPanel } from "@/components/dossier/ask-panel";
import { AddTodayBar, BottomNav } from "@/components/dossier/bottom-nav";
import { AppHeader } from "@/components/dossier/app-header";
import { StatsLine } from "@/components/dossier/stats-line";

export const Route = createFileRoute("/_authenticated/ask")({
  head: () => ({
    meta: [
      { title: "Ask the archive | Dossier" },
      {
        name: "description",
        content:
          "Ask anything about your child's past — what they were afraid of at three, when they were brave — and the matching memories float up.",
      },
      { property: "og:title", content: "Ask the archive" },
      {
        property: "og:description",
        content: "Years of small moments, searchable in a sentence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AskPage,
});

function AskPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <AddTodayBar />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-4 px-4 pb-8 pt-6">
        <h1 className="font-display text-2xl">Ask the archive</h1>
        <AskPanel />
        <StatsLine />
      </main>
      <BottomNav />
    </div>
  );
}
