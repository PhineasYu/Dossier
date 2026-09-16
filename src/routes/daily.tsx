import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { AddTodayBar, BottomNav } from "@/components/dossier/bottom-nav";
import { ActivityCalendar, currentStreak } from "@/components/dossier/activity-calendar";
import { ChildSwitcher } from "@/components/dossier/child-switcher";
import { DailyCheckin } from "@/components/dossier/daily-checkin";
import { useChildren } from "@/lib/child-context";
import { getCheckinActivity } from "@/lib/dossier.functions";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "Daily check-in — two questions a day | Dossier" },
      {
        name: "description",
        content:
          "Answer two questions out loud each evening and watch your streak and showing-up calendar fill in, one day of your child's story at a time.",
      },
      { property: "og:title", content: "Daily check-in — two questions a day" },
      {
        property: "og:description",
        content: "One minute a day keeps every year of your child's story.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DailyPage,
});

function DailyPage() {
  const { active } = useChildren();
  const fetchActivity = useServerFn(getCheckinActivity);
  const { data } = useQuery({
    queryKey: ["checkin-activity"],
    queryFn: () => fetchActivity({}),
  });

  const counts = data?.counts ?? {};

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 px-4 pb-4 pt-5 backdrop-blur">
        <ChildSwitcher />
      </header>
      <AddTodayBar />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 pb-8 pt-6">
        <h1 className="font-display text-2xl">Today with {active?.name ?? "your child"}</h1>
        <DailyCheckin streak={currentStreak(counts)} />
        <ActivityCalendar counts={counts} color={active?.theme_color ?? "#C2703D"} />
      </main>
      <BottomNav />
    </div>
  );
}
