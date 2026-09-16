import { Link } from "@tanstack/react-router";
import { Archive, Mic, ScrollText, Search, Sparkles } from "lucide-react";

const ITEMS = [
  { to: "/", label: "Timeline", icon: ScrollText },
  { to: "/profile", label: "Archive", icon: Archive },
  { to: "/capture", label: "Capture", icon: Mic },
  { to: "/ask", label: "Ask", icon: Search },
  { to: "/dossier-plus", label: "Dossier+", icon: Sparkles },
] as const;

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-20 border-t bg-background/90 backdrop-blur">
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2 py-1.5">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[11px] text-muted-foreground transition-colors"
              activeProps={{ style: { color: "var(--child)" } }}
              activeOptions={{ exact: to === "/" }}
            >
              <Icon className="size-5" strokeWidth={1.6} />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
