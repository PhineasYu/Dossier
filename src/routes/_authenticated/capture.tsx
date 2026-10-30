import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { BottomNav } from "@/components/dossier/bottom-nav";
import { ActivityCalendar } from "@/components/dossier/activity-calendar";
import { BrainDump } from "@/components/dossier/brain-dump";
import { AppHeader } from "@/components/dossier/app-header";
import { PromptDeck, type Prompt } from "@/components/dossier/prompt-deck";
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
      { title: "Tell Dossier | Dossier" },
      {
        name: "description",
        content:
          "Tell Dossier anything about anyone in the family, by voice or text. It files each piece under the right child.",
      },
      { property: "og:title", content: "Tell Dossier" },
      {
        property: "og:description",
        content: "Anything about anyone in the family, filed under the right child.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CapturePage,
});

function CapturePage() {
  const { mode } = Route.useSearch();
  const fetchActivity = useServerFn(getCheckinActivity);
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const { data } = useQuery({
    queryKey: ["checkin-activity"],
    queryFn: () => fetchActivity({}),
  });

  const counts = data?.counts ?? {};

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-5 pb-32 pt-5 sm:px-6">
        <div>
          <h1 className="display text-[44px] text-ink">Tell Dossier</h1>
          <p className="mt-2 max-w-sm text-[15px] text-ink-2">
            Say it once. Dossier sorts it.
          </p>
        </div>
        <BrainDump initialMode={mode} prompt={prompt} onClearPrompt={() => setPrompt(null)} />
        <PromptDeck
          onUse={(next) => {
            setPrompt(next);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
        <ActivityCalendar counts={counts} />
      </main>
      <BottomNav />
    </div>
  );
}
