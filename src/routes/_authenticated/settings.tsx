import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronRight, FolderHeart, LogOut, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AppHeader } from "@/components/dossier/app-header";
import { BottomNav } from "@/components/dossier/bottom-nav";
import { Buddy } from "@/components/dossier/buddy";
import { PolarCard } from "@/components/dossier/polar-card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useChildren } from "@/lib/child-context";
import { isGuest, leaveGuestMode } from "@/lib/guest";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings and account | Dossier" },
      {
        name: "description",
        content: "Your Dossier account, family profiles and membership in one place.",
      },
      { property: "og:title", content: "Settings and account | Dossier" },
      {
        property: "og:description",
        content: "Manage your account and open your family's profiles in Dossier.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { kids, lookOf, setActiveId } = useChildren();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [guest, setGuest] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    setGuest(isGuest());
    void supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    setLeaving(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await queryClient.cancelQueries();
      queryClient.clear();
      leaveGuestMode();
      await navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign out. Please try again.");
      setLeaving(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader showSwitcher={false} />
      <main className="mx-auto w-full max-w-xl flex-1 space-y-6 px-5 pb-32 pt-5 sm:px-6">
        <h1 className="display text-[44px] text-ink">Settings</h1>
        <section aria-labelledby="account-heading" className="space-y-3">
          <h2 id="account-heading" className="text-[21px] font-bold text-ink">
            Your account
          </h2>
          <div className="flex items-center gap-3 rounded-3xl bg-cloud p-5">
            <UserRound className="size-6 shrink-0 text-ink-2" aria-hidden="true" />
            <p className="min-w-0 break-words text-[17px] text-ink">
              {email ?? (guest ? "Guest preview" : "Your Dossier account")}
            </p>
          </div>
        </section>
        <section aria-labelledby="family-heading" className="space-y-3">
          <h2 id="family-heading" className="text-[21px] font-bold text-ink">
            Your family
          </h2>
          <ul className="divide-y divide-line">
            {kids.map((kid) => {
              const look = lookOf(kid.id);
              return (
                <li key={kid.id}>
                  <Button
                    asChild
                    variant="ghost"
                    className="h-auto min-h-16 w-full justify-start rounded-xl px-2 py-3"
                  >
                    <Link to="/profile" search={{ q: undefined }} onClick={() => setActiveId(kid.id)}>
                      <Buddy size={36} shape={look.shape} color={look.body} />
                      <span className="min-w-0 flex-1 break-words whitespace-normal text-[17px] font-semibold text-ink">
                        {kid.name}
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
          {kids.length === 0 && (
            <Button asChild variant="secondary">
              <Link to="/profile" search={{ q: undefined }}>
                <FolderHeart /> Open the archive
              </Link>
            </Button>
          )}
        </section>
        <details className="group border-t border-line pt-4">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-[21px] font-bold text-ink [&::-webkit-details-marker]:hidden">
            Dossier+{" "}
            <ChevronRight
              className="size-5 transition-transform group-open:rotate-90"
              aria-hidden="true"
            />
          </summary>
          <div className="pt-3">
            <PolarCard />
          </div>
        </details>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => void signOut()}
          disabled={leaving}
        >
          <LogOut aria-hidden="true" />{" "}
          {leaving ? "Leaving…" : guest && !email ? "Leave the demo" : "Sign out"}
        </Button>
      </main>
      <BottomNav />
    </div>
  );
}
