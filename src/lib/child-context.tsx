import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { Child } from "./dossier";
import { lookFor, type ChildLook } from "./palette";

type ChildContextValue = {
  kids: Child[];
  active: Child | null;
  activeId: string | null;
  setActiveId: (id: string) => void;
  isLoading: boolean;
  /** Crayon colours and buddy shape for any child id (falls back to the first crayon). */
  lookOf: (id: string | null | undefined) => ChildLook;
};

const ChildContext = createContext<ChildContextValue>({
  kids: [],
  active: null,
  activeId: null,
  setActiveId: () => {},
  isLoading: true,
  lookOf: () => lookFor(null, 0),
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

  const lookOf = (id: string | null | undefined) => {
    const index = Math.max(
      0,
      kids.findIndex((kid) => kid.id === id),
    );
    return lookFor(kids[index], index);
  };

  useEffect(() => {
    if (!active) return;
    const look = lookOf(active.id);
    const root = document.documentElement;
    root.style.setProperty("--child", `var(--${look.crayon})`);
    root.style.setProperty("--child-soft", `var(--${look.crayon}-soft)`);
    root.style.setProperty("--child-ink", `var(--${look.crayon}-ink)`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, kids]);

  return (
    <ChildContext.Provider
      value={{ kids, active, activeId: active?.id ?? null, setActiveId, isLoading, lookOf }}
    >
      {children}
    </ChildContext.Provider>
  );
}
