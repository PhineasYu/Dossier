import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { AddTodayBar, BottomNav } from "@/components/dossier/bottom-nav";
import { AppHeader } from "@/components/dossier/app-header";
import { DocumentArchive } from "@/components/dossier/document-archive";
import { ProfilePanel } from "@/components/dossier/profile-panel";
import { useChildren } from "@/lib/child-context";
import { ArchiveSearch } from "@/components/dossier/archive-search";

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (search: Record<string, unknown>) => ({
    add: search["add"] === "photo" ? ("photo" as const) : undefined,
    q: typeof search["q"] === "string" ? search["q"] : "",
  }),
  head: () => ({
    meta: [
      { title: "The file — allergies, growth and documents | Dossier" },
      {
        name: "description",
        content:
          "Every structured fact in one place: allergies and medical notes, the height and weight curve, food, interests, friends and filed documents.",
      },
      { property: "og:title", content: "The file — allergies, growth and documents" },
      {
        property: "og:description",
        content: "The structured half of your child's archive, kept up to date by talking.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { active } = useChildren();
  const { add, q } = Route.useSearch();
  const navigate = useNavigate({ from: "/profile" });

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <AddTodayBar />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-3 px-4 pb-8">
        <h1 className="pt-7 pb-1 font-display text-2xl">
          {active ? `${active.name}'s file` : "The file"}
        </h1>
        <ArchiveSearch scope="archive" query={q} onQueryChange={(value) => navigate({ search: (previous) => ({ ...previous, q: value }), replace: true })} />
        <ProfilePanel query={q} />
        <DocumentArchive autoOpen={add === "photo"} query={q} />
      </main>
      <BottomNav />
    </div>
  );
}
