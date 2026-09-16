import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { AddTodayBar, BottomNav } from "@/components/dossier/bottom-nav";
import { ChildSwitcher } from "@/components/dossier/child-switcher";
import { Splash } from "@/components/dossier/splash";
import { StatsLine } from "@/components/dossier/stats-line";
import { Timeline } from "@/components/dossier/timeline";
import { useChildren } from "@/lib/child-context";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({
    meta: [
      { title: "Dossier — your child's lifelong story" },
      {
        name: "description",
        content:
          "Dossier turns everyday moments into each child's growth timeline and living profile. Just talk, and it sorts the rest.",
      },
      { property: "og:title", content: "Dossier — your child's lifelong story" },
      {
        property: "og:description",
        content:
          "Speak freely about your day. Dossier files the memories and the facts for every child.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const { active } = useChildren();

  return (
    <div className="flex min-h-screen flex-col">
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}

      <header className="sticky top-0 z-10 border-b bg-background/90 px-4 pb-4 pt-5 backdrop-blur">
        <p className="mb-3 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Dossier
        </p>
        <ChildSwitcher />
      </header>
      <AddTodayBar />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-8">
        <h1 className="pt-7 pb-4 font-display text-2xl">
          {active ? `${active.name}'s story so far` : "The archive"}
        </h1>
        <Timeline />
        <StatsLine />
      </main>

      <BottomNav />
    </div>
  );
}
