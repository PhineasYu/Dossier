import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AddTodayBar, BottomNav } from "@/components/dossier/bottom-nav";
import { ActivityCalendar, currentStreak } from "@/components/dossier/activity-calendar";
import { BrainDump } from "@/components/dossier/brain-dump";
import { AppHeader } from "@/components/dossier/app-header";
import { DailyCheckin } from "@/components/dossier/daily-checkin";
import { useChildren } from "@/lib/child-context";
import { getCheckinActivity } from "@/lib/dossier.functions";

export const Route = createFileRoute("/_authenticated/capture")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode:
      search["mode"] === "voice" || search["mode"] === "text"
        ? (search["mode"] as "voice" | "text")
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Capture today — two questions and a brain dump | Dossier" },
      {
        name: "description",
        content:
          "Answer today's two questions out loud, keep your showing-up streak alive, or talk freely and let Dossier sort everything into each child's story.",
      },
      { property: "og:title", content: "Capture today — two questions and a brain dump" },
      {
        property: "og:description",
        content: "One minute a day keeps every year of your child's story.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CapturePage,
});

function CapturePage() {
  const { mode } = Route.useSearch();
  const { active } = useChildren();
  const fetchActivity = useServerFn(getCheckinActivity);
  const { data } = useQuery({
    queryKey: ["checkin-activity"],
    queryFn: () => fetchActivity({}),
  });

  const counts = data?.counts ?? {};

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <AddTodayBar />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-8 px-4 pb-8 pt-6">
        <h1 className="font-display text-2xl">Today with {active?.name ?? "your child"}</h1>
        <DailyCheckin streak={currentStreak(counts)} />
        <ActivityCalendar counts={counts} color={active?.theme_color ?? "#C2703D"} />

        <section className="space-y-3">
          <h2 className="font-display text-xl">Or just talk it out</h2>
          <p className="text-sm text-muted-foreground">
            Say everything from today in one go — Dossier splits it into memories and profile
            updates for each child.
          </p>
          <BrainDump initialMode={mode} />
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
