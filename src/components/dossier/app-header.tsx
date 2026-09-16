import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";

import { ChildSwitcher } from "@/components/dossier/child-switcher";
import { Wordmark } from "@/components/dossier/wordmark";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isGuest, leaveGuestMode } from "@/lib/guest";

export function AppHeader({ showSwitcher = true }: { showSwitcher?: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState<string | null>(null);
  const [guest, setGuest] = useState(false);

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

  return (
    <header className="sticky top-0 z-10 border-b bg-background/90 px-4 pb-4 pt-4 backdrop-blur">
      <div className="mb-3 flex items-center justify-between">
        <Wordmark className="h-5" />
        <div className="flex items-center gap-2">
          {email && (
            <span className="max-w-[9rem] truncate text-[11px] text-muted-foreground">{email}</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="h-8 gap-1 px-2 text-[11px] text-muted-foreground"
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
