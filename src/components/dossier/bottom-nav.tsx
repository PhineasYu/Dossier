import { Link } from "@tanstack/react-router";
import { Archive, Camera, Mic, ScrollText, Sparkles, Type } from "lucide-react";

import { Button } from "@/components/ui/button";

const ITEMS = [
  { to: "/app", label: "Timeline", icon: ScrollText },
  { to: "/profile", label: "Archive", icon: Archive },
  { to: "/capture", label: "Capture", icon: Mic },
  { to: "/dossier-plus", label: "Dossier+", icon: Sparkles },
] as const;

export function BottomNav() {
  return (
    <nav aria-label="Main navigation" className="sticky bottom-0 z-20 border-t border-outline-variant bg-surface-container shadow-[var(--elevation-2)]">
      <ul className="mx-auto flex max-w-xl items-stretch justify-between px-2 py-2">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              className="group flex min-h-12 flex-col items-center gap-0.5 rounded-2xl px-1 py-1 text-[10px] font-medium text-on-surface-variant transition-colors"
              activeProps={{ className: "text-on-primary-container [&_svg]:rounded-full [&_svg]:bg-child-soft [&_svg]:p-1.5 [&_svg]:box-content" }}
              activeOptions={{ exact: to === "/app" }}
            >
               <Icon className="size-5 transition-all" strokeWidth={1.8} />
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
    <div className="border-b border-outline-variant bg-surface-container-low/95 backdrop-blur">
      <div className="mx-auto grid max-w-xl grid-cols-3 gap-2 px-4 py-3">
        <Button asChild className="h-10 bg-child text-primary-foreground">
          <Link to="/capture" search={{ mode: "voice" }} aria-label="Add today by voice">
            <Mic /> Voice
          </Link>
        </Button>
        <Button asChild variant="secondary" className="h-10 bg-child-soft text-foreground">
          <Link to="/profile" search={{ add: "photo" }} aria-label="Add a photo today">
            <Camera /> Photo
          </Link>
        </Button>
        <Button asChild variant="secondary" className="h-10 bg-child-soft text-foreground">
          <Link to="/capture" search={{ mode: "text" }} aria-label="Add today by text">
            <Type /> Text
          </Link>
        </Button>
      </div>
    </div>
  );
}
