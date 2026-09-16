import { createFileRoute } from "@tanstack/react-router";

import { AppHeader } from "@/components/dossier/app-header";
import { ArchiveChat } from "@/components/dossier/archive-chat";
import { AddTodayBar, BottomNav } from "@/components/dossier/bottom-nav";
import { PolarCard } from "@/components/dossier/polar-card";
import { StatsLine } from "@/components/dossier/stats-line";

export const Route = createFileRoute("/_authenticated/dossier-plus")({
  head: () => ({
    meta: [
      { title: "Dossier+ — keep every year | Dossier" },
      {
        name: "description",
        content:
          "Subscribe to Dossier+ for unlimited memories, the full profile archive and every document kept safe for the whole childhood.",
      },
      { property: "og:title", content: "Dossier+ — keep every year" },
      {
        property: "og:description",
        content: "Scan the card to subscribe and keep the whole story.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlusPage,
});

function PlusPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader showSwitcher={false} />
      <AddTodayBar />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-10">
        <ArchiveChat />
        <PolarCard />
        <StatsLine />
      </main>
      <BottomNav />
    </div>
  );
}
