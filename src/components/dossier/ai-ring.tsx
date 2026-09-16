import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AiRing({ children, active = false, className }: { children?: ReactNode; active?: boolean; className?: string }) {
  return (
    <div className={cn("ai-ring", active && "ai-ring-active", className)} aria-label={active ? "Dossier AI is active" : undefined}>
      <span className="ai-ring-segment ai-ring-orange" />
      <span className="ai-ring-segment ai-ring-purple" />
      <span className="ai-ring-segment ai-ring-green" />
      <span className="ai-ring-segment ai-ring-blue" />
      <div className="ai-ring-content">{children}</div>
    </div>
  );
}