import { Link } from "@tanstack/react-router";
import { AudioLines, FolderHeart, ScrollText, Sparkles } from "lucide-react";

/** Story, capture and file first; asking Dossier's AI is the last stop. */
const ITEMS = [
  { to: "/app", label: "Timeline", icon: ScrollText },
  { to: "/capture", label: "Today", icon: AudioLines },
  { to: "/profile", label: "Archive", icon: FolderHeart },
  { to: "/dossier-plus", label: "Ask Dossier", icon: Sparkles },
] as const;

/**
 * One floating liquid-glass capsule. Every destination is drawn the same way, as an
 * icon; the current page sits on a white lens. Names are for screen readers.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Main navigation"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-6 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="liquid-glass pointer-events-auto mx-auto flex max-w-sm items-center gap-1 rounded-full p-1.5">
        {ITEMS.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/app", includeSearch: false }}
            aria-label={label}
            title={label}
            className="press grid h-12 flex-1 place-items-center rounded-full text-ink-2 hover:bg-paper/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action-ink"
            activeProps={{ className: "liquid-lens text-ink" }}
          >
            {({ isActive }) => <Icon className="size-[22px]" strokeWidth={isActive ? 2.2 : 1.8} />}
          </Link>
        ))}
      </div>
    </nav>
  );
}
