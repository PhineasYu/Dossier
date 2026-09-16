import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { withAlpha, type Child } from "./dossier";

type ChildContextValue = {
  kids: Child[];
  active: Child | null;
  activeId: string | null;
  setActiveId: (id: string) => void;
  isLoading: boolean;
};

const ChildContext = createContext<ChildContextValue>({
  kids: [],
  active: null,
  activeId: null,
  setActiveId: () => {},
  isLoading: true,
});

export function useChildren() {
  return useContext(ChildContext);
}

export function ChildProvider({ children }: { children: ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: kids = [], isLoading } = useQuery({
    queryKey: ["children"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("children")
        .select("id, name, avatar_url, theme_color, birthdate")
        .order("created_at");
      if (error) throw error;
      return data as Child[];
    },
  });

  useEffect(() => {
    if (!activeId && kids.length) setActiveId(kids[0]!.id);
  }, [kids, activeId]);

  const active = kids.find((kid) => kid.id === activeId) ?? kids[0] ?? null;

  useEffect(() => {
    if (!active) return;
    const root = document.documentElement;
    root.style.setProperty("--child", active.theme_color);
    root.style.setProperty("--child-soft", withAlpha(active.theme_color, 0.14));
  }, [active]);

  return (
    <ChildContext.Provider
      value={{ kids, active, activeId: active?.id ?? null, setActiveId, isLoading }}
    >
      {children}
    </ChildContext.Provider>
  );
}
