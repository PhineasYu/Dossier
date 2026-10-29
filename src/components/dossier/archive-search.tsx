import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AiBuddy } from "@/components/dossier/buddy";
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
        onSubmit={(event) => {
          event.preventDefault();
          ask();
        }}
        className="flex h-14 items-center gap-2 rounded-full bg-cloud pl-4 pr-1.5 transition-shadow focus-within:ring-2 focus-within:ring-action-ink"
      >
        <Search className="size-[18px] shrink-0 text-ink-2" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setAnswer("");
            setSources([]);
            onTimelineMatches?.(undefined);
          }}
          placeholder={
            scope === "timeline"
              ? `Search or ask about ${active?.name ?? "your child"}`
              : `Search ${active?.name ?? "your child"}'s file`
          }
          aria-label={scope === "timeline" ? "Search the story" : "Search the file"}
          className="h-full min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-ink-2"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={clear}
            aria-label="Clear search"
          >
            <X />
          </Button>
        )}
        <Button
          type="submit"
          variant="ai"
          disabled={isAsking || !query.trim()}
          className="shrink-0 px-4"
        >
          {isAsking ? <Loader2 className="animate-spin" /> : "Ask"}
        </Button>
      </form>

      <AnimatePresence>
        {answer && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex gap-3 rounded-3xl bg-action-soft p-4"
          >
            <AiBuddy size={36} className="mt-0.5" />
            <div className="min-w-0">
              <p className="text-[15px] leading-relaxed">{answer}</p>
              {sources.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {sources.map((source) => (
                    <li key={source.id} className="rounded-full bg-paper px-3 py-1 text-[13px]">
                      {source.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
