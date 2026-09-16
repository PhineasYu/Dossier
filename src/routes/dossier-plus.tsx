import { createFileRoute } from "@tanstack/react-router";

import { BottomNav } from "@/components/dossier/bottom-nav";
import { PolarCard } from "@/components/dossier/polar-card";
import { StatsLine } from "@/components/dossier/stats-line";

export const Route = createFileRoute("/dossier-plus")({
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
    ],
  }),
  component: PlusPage,
});

function PlusPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-4 px-4 py-10">
        <PolarCard />
        <StatsLine />
      </main>
      <BottomNav />
    </div>
  );
}
