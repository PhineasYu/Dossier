import { createFileRoute } from "@tanstack/react-router";

import { BottomNav } from "@/components/dossier/bottom-nav";
import { BrainDump } from "@/components/dossier/brain-dump";
import { ChildSwitcher } from "@/components/dossier/child-switcher";

export const Route = createFileRoute("/capture")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode:
      search["mode"] === "voice" || search["mode"] === "text"
        ? (search["mode"] as "voice" | "text")
        : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Talk it out — capture today | Dossier" },
      {
        name: "description",
        content:
          "Hold the mic and talk for a minute. Dossier splits what you said into memories and profile updates for each child.",
      },
      { property: "og:title", content: "Talk it out — capture today" },
      {
        property: "og:description",
        content: "One brain dump in, two kinds of memory out: the story and the facts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CapturePage,
});

function CapturePage() {
  const { mode } = Route.useSearch();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/90 px-4 pb-4 pt-5 backdrop-blur">
        <ChildSwitcher />
      </header>
      <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-4 pb-8 pt-6">
        <BrainDump initialMode={mode} />

        <section className="space-y-3">
          <h2 className="font-display text-lg">Today&apos;s two questions</h2>
          <div className="paper rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">1 / Today</p>
            <p className="mt-1">What did you do for your child today?</p>
          </div>
          <div className="paper rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">2 / Today</p>
            <p className="mt-1">What did your child do today that you&apos;ll remember?</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Answer them out loud with the mic above — same pipeline, no forms.
          </p>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
