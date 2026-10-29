import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { BottomNav } from "@/components/dossier/bottom-nav";
import { AppHeader } from "@/components/dossier/app-header";
import { DocumentArchive } from "@/components/dossier/document-archive";
import { FamilyCircle } from "@/components/dossier/family-circle";
import { ProfilePanel } from "@/components/dossier/profile-panel";
import { useChildren } from "@/lib/child-context";
import { ArchiveSearch } from "@/components/dossier/archive-search";

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: (search: Record<string, unknown>) => ({
    add: search["add"] === "photo" ? ("photo" as const) : undefined,
    q: typeof search["q"] === "string" ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "The file — allergies, growth and documents | Dossier" },
      {
        name: "description",
        content:
          "Search every structured fact and document in one place, including allergies, growth, food, interests, friends and filed records.",
      },
      { property: "og:title", content: "The file — allergies, growth and documents" },
      {
        property: "og:description",
        content: "Search your child's facts and documents in the structured half of their archive.",
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
      <main className="mx-auto w-full max-w-xl flex-1 space-y-5 px-5 pb-32 sm:px-6">
        <h1 className="display break-words pb-1 pt-5 text-[44px] text-ink">
          {active ? `${active.name}\u2019s file` : "The file"}
        </h1>
        <ArchiveSearch
          scope="archive"
          query={q ?? ""}
          onQueryChange={(value) =>
            navigate({
              search: (previous) => ({ ...previous, q: value || undefined }),
              replace: true,
            })
          }
        />
        <ProfilePanel query={q ?? ""} />
        <DocumentArchive autoOpen={add === "photo"} query={q ?? ""} />
        <FamilyCircle name={active?.name ?? "your child"} />
      </main>
      <BottomNav />
    </div>
  );
}
