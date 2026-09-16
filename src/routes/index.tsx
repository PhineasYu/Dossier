import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { GrowingFamily } from "@/components/dossier/growing-family";
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
    <main className="flex min-h-screen flex-col items-center justify-between px-5 pb-10 pt-12">
      <h1>
        <Wordmark className="h-10" />
        <span className="sr-only">Dossier</span>
      </h1>

      <div className="flex w-full flex-1 items-center justify-center py-8">
        <GrowingFamily />
      </div>

      <div className="w-full max-w-sm space-y-2">
          <Button
            onClick={signIn}
            disabled={busy}
            size="lg"
            className="h-12 w-full rounded-full bg-child text-primary-foreground hover:bg-child/90"
          >
            <GoogleGlyph />
            {busy ? "Connecting…" : "Sign in with Google"}
          </Button>
          <Button
            variant="ghost"
            onClick={lookAround}
            className="w-full text-sm text-muted-foreground"
          >
            Just look around
          </Button>
      </div>
    </main>
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
