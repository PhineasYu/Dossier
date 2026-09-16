import { createFileRoute } from "@tanstack/react-router";

import { AddTodayBar, BottomNav } from "@/components/dossier/bottom-nav";
import { ChildSwitcher } from "@/components/dossier/child-switcher";
import { DocumentArchive } from "@/components/dossier/document-archive";
import { ProfilePanel } from "@/components/dossier/profile-panel";
import { useChildren } from "@/lib/child-context";

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (search: Record<string, unknown>) => ({
    add: search["add"] === "photo" ? ("photo" as const) : undefined,
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
  const { add } = Route.useSearch();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 px-4 pb-4 pt-5 backdrop-blur">
        <ChildSwitcher />
      </header>
      <AddTodayBar />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-3 px-4 pb-8">
        <h1 className="pt-7 pb-1 font-display text-2xl">
          {active ? `${active.name}'s file` : "The file"}
        </h1>
        <ProfilePanel />
        <DocumentArchive autoOpen={add === "photo"} />
      </main>
      <BottomNav />
    </div>
  );
}
