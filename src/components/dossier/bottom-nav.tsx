import { Link } from "@tanstack/react-router";
import { Archive, Camera, Flame, Mic, ScrollText, Search, Sparkles, Type } from "lucide-react";

import { Button } from "@/components/ui/button";

const ITEMS = [
  { to: "/", label: "Timeline", icon: ScrollText },
  { to: "/profile", label: "Archive", icon: Archive },
  { to: "/daily", label: "Daily", icon: Flame },
  { to: "/capture", label: "Capture", icon: Mic },
  { to: "/ask", label: "Ask", icon: Search },
  { to: "/dossier-plus", label: "Dossier+", icon: Sparkles },
] as const;

export function BottomNav() {
  return (
    <nav aria-label="Main navigation" className="sticky bottom-0 z-20 border-t bg-background/95 backdrop-blur">
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2 py-1">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="flex flex-col items-center gap-0.5 rounded-xl px-1 py-1.5 text-[10px] text-muted-foreground transition-colors"
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

export function AddTodayBar() {
  return (
    <div className="border-b bg-background/90 backdrop-blur">
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-2 px-4 py-3">
        <Button asChild size="sm" className="h-10 rounded-full bg-child text-primary-foreground hover:bg-child/90">
          <Link to="/capture" search={{ mode: "voice" }} aria-label="Add today by voice">
            <Mic /> Voice
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-10 rounded-full border-child/40 bg-child-soft text-foreground">
          <Link to="/profile" search={{ add: "photo" }} aria-label="Add a photo today">
            <Camera /> Photo
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline" className="h-10 rounded-full border-child/40 bg-child-soft text-foreground">
          <Link to="/capture" search={{ mode: "text" }} aria-label="Add today by text">
            <Type /> Text
          </Link>
        </Button>
      </div>
    </div>
  );
}
