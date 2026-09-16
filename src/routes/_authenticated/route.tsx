import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { isGuest } from "@/lib/guest";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    if (isGuest()) return { user: null };
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});
