import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useChildren } from "@/lib/child-context";
import { askArchive } from "@/lib/dossier.functions";

type SearchScope = "timeline" | "archive";
type Source = { id: string; label: string; kind: "fact" | "document" };

export function ArchiveSearch({
  scope,
  query,
  onQueryChange,
  onTimelineMatches,
}: {
  scope: SearchScope;
  query: string;
  onQueryChange: (query: string) => void;
  onTimelineMatches?: (ids: string[] | undefined) => void;
}) {
  const { active } = useChildren();
  const run = useServerFn(askArchive);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const clear = () => {
    onQueryChange("");
    setAnswer("");
    setSources([]);
    onTimelineMatches?.(undefined);
  };

  const ask = async () => {
    if (!query.trim() || !active) return;
    setIsAsking(true);
    try {
      const result = await run({ data: { question: query, childId: active.id, scope } });
      setAnswer(result.answer);
      setSources(result.sources);
      onTimelineMatches?.(result.cardIds);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Search is unavailable right now.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <section className="space-y-3" aria-label={`${scope} search`}>
      <form
        onSubmit={(event) => { event.preventDefault(); ask(); }}
        className="flex min-h-14 items-center gap-2 rounded-full bg-surface-container-high px-4 shadow-[var(--elevation-1)] focus-within:ring-2 focus-within:ring-ring"
      >
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setAnswer("");
            setSources([]);
            onTimelineMatches?.(undefined);
          }}
          placeholder={scope === "timeline" ? `Search ${active?.name ?? "your child's"} timeline…` : `Search ${active?.name ?? "your child's"} archive…`}
          aria-label={scope === "timeline" ? "Search timeline" : "Search archive"}
          className="min-w-0 flex-1 bg-transparent py-1.5 text-sm outline-none"
        />
        {query && <Button type="button" variant="ghost" size="icon-sm" onClick={clear} aria-label="Clear search"><X /></Button>}
        <Button type="submit" disabled={isAsking || !query.trim()} size="sm" className="bg-child text-primary-foreground">
          {isAsking ? <Loader2 className="animate-spin" /> : "Ask"}
        </Button>
      </form>

      <AnimatePresence>
        {answer && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border-l-2 border-child px-4 py-2">
            <p className="text-sm leading-relaxed">{answer}</p>
            {sources.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {sources.map((source) => <li key={source.id} className="rounded-full bg-child-soft px-3 py-1 text-xs"><span className="capitalize text-muted-foreground">{source.kind}</span> · {source.label}</li>)}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}