import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { LogOut, MoreHorizontal, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ChildSwitcher } from "@/components/dossier/child-switcher";
import { Wordmark } from "@/components/dossier/wordmark";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { resetTodayCheckin, resetTodayCheckinAuthenticated } from "@/lib/dossier.functions";
import { isGuest, leaveGuestMode } from "@/lib/guest";

export function AppHeader({ showSwitcher = true }: { showSwitcher?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [guest, setGuest] = useState(false);
  const resetGuest = useServerFn(resetTodayCheckin);
  const resetAuthenticated = useServerFn(resetTodayCheckinAuthenticated);

  useEffect(() => {
    setGuest(isGuest());
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    leaveGuestMode();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  async function resetCheckin() {
    if (guest) await resetGuest({});
    else await resetAuthenticated({});
    await queryClient.invalidateQueries({ queryKey: ["today-checkin"] });
    toast("Today's questions are open again.");
  }

  return (
    <header className="sticky top-0 z-10 bg-paper/80 px-4 pb-3 pt-4 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto max-w-xl">
        <div className="mb-3 flex items-center justify-between">
          <Wordmark className="text-[26px]" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon-sm" aria-label="Account and settings">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-56 rounded-2xl p-1.5">
              <DropdownMenuLabel className="truncate text-xs font-normal text-ink-3">
                {email ?? "Looking around as a guest"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={resetCheckin} className="rounded-xl">
                <RotateCcw /> Ask today&apos;s questions again
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={signOut} className="rounded-xl">
                <LogOut /> {guest && !email ? "Leave the demo" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {showSwitcher && <ChildSwitcher />}
      </div>
    </header>
  );
}
