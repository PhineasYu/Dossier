import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mic, ScrollText, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PolarCard } from "@/components/dossier/polar-card";
import { Wordmark } from "@/components/dossier/wordmark";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { enterGuestMode, leaveGuestMode } from "@/lib/guest";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dossier — an AI family archive for your child's story" },
      {
        name: "description",
        content:
          "Speak freely about your day and Dossier files it: memory cards on your child's timeline and a living profile with allergies, growth, food, interests and friends.",
      },
      { property: "og:title", content: "Dossier — an AI family archive" },
      {
        property: "og:description",
        content: "One voice note becomes memories and facts, sorted for every child.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: Mic,
    title: "Talk for a minute",
    body: "Ramble about the whole day. Dossier splits it into atomic moments and sends each one to the right child.",
  },
  {
    icon: ScrollText,
    title: "Two outputs, one input",
    body: "Memories land on the growth timeline; facts update the file — allergies, height and weight, food, interests, friends.",
  },
  {
    icon: Search,
    title: "Ask the archive",
    body: "\u201cWhat was she afraid of at three?\u201d The matching cards float up, years later.",
  },
] as const;

function Landing() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app", replace: true });
    });
  }, [navigate]);

  async function signIn() {
    setBusy(true);
    try {
      leaveGuestMode();
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in didn't complete. Please try again.");
        return;
      }
      if (result.redirected) return;
      navigate({ to: "/app", replace: true });
    } catch {
      toast.error("Google sign-in didn't complete. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function lookAround() {
    enterGuestMode();
    navigate({ to: "/app" });
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto w-full max-w-xl px-5 pb-16 pt-14">
        <Wordmark className="h-9" />
        <h1 className="mt-7 font-display text-3xl leading-tight">
          Turn everyday moments into your child's lifelong story.
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          Doorframe pencil marks catch the height. Dossier catches the other ninety percent of
          growing up — and keeps the practical file up to date while you're at it.
        </p>

        <div className="mt-8 space-y-3">
          <Button
            onClick={signIn}
            disabled={busy}
            size="lg"
            className="h-12 w-full rounded-full bg-child text-primary-foreground hover:bg-child/90"
          >
            <GoogleGlyph />
            Sign in with Google
          </Button>
          <button
            type="button"
            onClick={lookAround}
            className="block w-full text-center text-sm text-muted-foreground underline underline-offset-4"
          >
            Just look around
          </button>
        </div>

        <section className="mt-12 space-y-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2">
                <Icon className="size-4 text-child" strokeWidth={1.8} />
                <h2 className="font-display text-lg">{title}</h2>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-12">
          <PolarCard />
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground">
          Dossier — an AI family archive.
        </p>
      </main>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1H12v2.98h5.35c-.24 1.4-1.7 4.1-5.35 4.1A5.92 5.92 0 0 1 6.1 12 5.92 5.92 0 0 1 12 6.08c1.6 0 2.75.62 3.4 1.2l2.3-2.2C16.3 3.7 14.4 3 12 3a9 9 0 1 0 0 18c5.2 0 8.63-3.65 8.63-8.8 0-.6-.07-1.05-.28-1.1Z"
      />
    </svg>
  );
}
