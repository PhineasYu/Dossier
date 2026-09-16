import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Mic, Square, Undo2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { captureEntry, getScribeToken, undoEntry } from "@/lib/dossier.functions";
import { useChildren } from "@/lib/child-context";
import { CATEGORY_LABEL, FIELD_LABEL, withAlpha } from "@/lib/dossier";

type SortedItem = {
  id: string;
  childId: string;
  kind: "card" | "fact";
  label: string;
  text: string;
};

export function BrainDump({ initialMode }: { initialMode: "voice" | "text" | undefined }) {
  const { kids } = useChildren();
  const queryClient = useQueryClient();
  const runCapture = useServerFn(captureEntry);
  const runUndo = useServerFn(undoEntry);
  const fetchToken = useServerFn(getScribeToken);

  const [typed, setTyped] = useState("");
  const [showTyping, setShowTyping] = useState(initialMode === "text");
  const [isSorting, setIsSorting] = useState(false);
  const [items, setItems] = useState<SortedItem[]>([]);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    memories: number;
    updates: number;
    children: number;
  } | null>(null);
  const didOpenInitialMode = useRef(false);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
  });

  const liveTranscript = useMemo(() => {
    const committed = scribe.committedTranscripts.map((t) => t.text).join(" ");
    return [committed, scribe.partialTranscript].filter(Boolean).join(" ").trim();
  }, [scribe.committedTranscripts, scribe.partialTranscript]);

  const sort = useCallback(
    async (transcript: string, source: "voice" | "text") => {
      if (!transcript.trim()) {
        toast.error("Nothing was captured — try again.");
        return;
      }
      setIsSorting(true);
      setItems([]);
      setSummary(null);
      try {
        const result = await runCapture({ data: { transcript, source } });
        const sorted: SortedItem[] = [
          ...result.cards.map((card) => ({
            id: card.id,
            childId: card.child_id,
            kind: "card" as const,
            label: CATEGORY_LABEL[card.category] ?? card.category,
            text: card.title,
          })),
          ...result.facts.map((fact) => ({
            id: fact.id,
            childId: fact.child_id,
            kind: "fact" as const,
            label: FIELD_LABEL[fact.field] ?? fact.field,
            text: fact.value,
          })),
        ];
        setItems(sorted);
        setEntryId(result.entryId);
        setSummary(result.summary);
        setTyped("");
        await queryClient.invalidateQueries();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Sorting failed.");
      } finally {
        setIsSorting(false);
      }
    },
    [queryClient, runCapture],
  );

  const start = useCallback(async () => {
    try {
      const { token } = await fetchToken({});
      await scribe.connect({
        token,
        microphone: { echoCancellation: true, noiseSuppression: true },
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Microphone unavailable.");
      setShowTyping(true);
    }
  }, [fetchToken, scribe]);

  useEffect(() => {
    if (didOpenInitialMode.current) return;
    didOpenInitialMode.current = true;
    if (initialMode === "voice") void start();
    if (initialMode === "text") setShowTyping(true);
  }, [initialMode, start]);

  const stop = useCallback(async () => {
    const transcript = liveTranscript;
    await scribe.disconnect();
    await sort(transcript, "voice");
  }, [liveTranscript, scribe, sort]);

  const undo = useCallback(async () => {
    if (!entryId) return;
    await runUndo({ data: { entryId } });
    setItems([]);
    setSummary(null);
    setEntryId(null);
    await queryClient.invalidateQueries();
    toast("Put back the way it was.");
  }, [entryId, queryClient, runUndo]);

  const isRecording = scribe.isConnected;

  return (
    <section className="space-y-5">
      <div className="material-card p-6 text-center">
        <h2 className="font-display text-xl">Just talk</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          Mix everything together. Dossier sorts it into each child&apos;s story.
        </p>

        <Button
          type="button"
          onClick={isRecording ? stop : start}
          disabled={isSorting}
          size="icon"
          className="mx-auto mt-6 size-24 bg-child text-primary-foreground shadow-[var(--elevation-3)] [&_svg]:size-9"
          style={{ backgroundColor: "var(--child)" }}
          aria-label={isRecording ? "Stop and sort" : "Start talking"}
        >
          {isSorting ? (
            <Loader2 className="size-9 animate-spin" />
          ) : isRecording ? (
            <Square className="size-8" />
          ) : (
            <Mic className="size-9" />
          )}
        </Button>

        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
          {isSorting
            ? "Sorting…"
            : isRecording
              ? "Listening — tap to stop"
              : "Tap the mic and speak"}
        </p>

        {(isRecording || liveTranscript) && (
          <p className="mt-4 min-h-16 rounded-xl bg-surface-container-high p-4 text-left text-sm leading-relaxed">
            {liveTranscript || "…"}
          </p>
        )}

        <Button
          type="button"
          onClick={() => setShowTyping((value) => !value)}
          variant="ghost"
          size="sm"
          className="mt-4 text-xs text-on-surface-variant"
        >
          {showTyping ? "Hide typing" : "Type instead"}
        </Button>

        {showTyping && (
          <div className="mt-3 space-y-2 text-left">
            <textarea
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              rows={4}
              placeholder="Luca tried mango today and his lips got a bit swollen…"
              className="w-full rounded-xl border border-outline bg-surface-container-low p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
              style={{ boxShadow: "none" }}
            />
            <Button
              type="button"
              onClick={() => sort(typed, "text")}
              disabled={isSorting || !typed.trim()}
              className="w-full bg-child text-primary-foreground"
            >
              Sort this
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {kids.map((kid) => (
          <div
            key={kid.id}
            className="min-h-40 rounded-3xl border p-3 shadow-[var(--elevation-1)]"
            style={{
              borderColor: withAlpha(kid.theme_color, 0.4),
              backgroundColor: withAlpha(kid.theme_color, 0.05),
            }}
          >
            <p className="mb-2 font-display text-sm" style={{ color: kid.theme_color }}>
              {kid.name}
            </p>
            <ul className="space-y-2">
              <AnimatePresence>
                {items
                  .filter((item) => item.childId === kid.id)
                  .map((item, index) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: -40, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: index * 0.25, type: "spring", stiffness: 220, damping: 22 }}
                      className="rounded-xl bg-surface-container-low p-2.5 text-left text-xs shadow-[var(--elevation-1)]"
                      style={{ borderLeft: `2px solid ${kid.theme_color}` }}
                    >
                      <span
                        className="block text-[10px] uppercase tracking-wide"
                        style={{ color: kid.theme_color }}
                      >
                        {item.kind === "card" ? item.label : `${item.label} · updated`}
                      </span>
                      {item.text}
                    </motion.li>
                  ))}
              </AnimatePresence>
            </ul>
          </div>
        ))}
      </div>

      {summary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: items.length * 0.25 + 0.2 }}
          className="material-card flex items-center justify-between px-4 py-3 text-sm"
        >
          <span>
            {summary.memories} {summary.memories === 1 ? "memory" : "memories"} ·{" "}
            {summary.updates} profile {summary.updates === 1 ? "update" : "updates"} ·{" "}
            {summary.children} {summary.children === 1 ? "child" : "children"}
          </span>
          <Button
            type="button"
            onClick={undo}
            variant="ghost"
            size="sm"
            className="text-on-surface-variant"
          >
            <Undo2 className="size-3.5" /> Undo
          </Button>
        </motion.div>
      )}
    </section>
  );
}
