import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut, MoreVertical, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

import { ChildSwitcher } from "@/components/dossier/child-switcher";
import { Wordmark } from "@/components/dossier/wordmark";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isGuest, leaveGuestMode } from "@/lib/guest";
import {
  resetTodayCheckin,
  resetTodayCheckinAuthenticated,
} from "@/lib/dossier.functions";
import { useServerFn } from "@tanstack/react-start";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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
    toast("Today's check-in is ready to demo again.");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-surface/95 px-4 pb-4 pt-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <Wordmark className="h-5" />
        <div className="flex items-center gap-2">
          {email && (
            <span className="max-w-[9rem] truncate text-[11px] text-muted-foreground">{email}</span>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Settings">
                <MoreVertical />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={resetCheckin}>
                <RotateCcw /> Reset today&apos;s check-in
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="h-8 gap-1 px-3 text-[11px] text-on-surface-variant"
          >
            <LogOut className="size-3.5" />
            {guest && !email ? "Leave" : "Sign out"}
          </Button>
        </div>
      </div>
      {showSwitcher && <ChildSwitcher />}
    </header>
  );
}
