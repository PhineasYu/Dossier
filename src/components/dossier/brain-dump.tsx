import { useScribe } from "@elevenlabs/react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Mic, Square, Undo2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

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

export function BrainDump() {
  const { kids } = useChildren();
  const queryClient = useQueryClient();
  const runCapture = useServerFn(captureEntry);
  const runUndo = useServerFn(undoEntry);
  const fetchToken = useServerFn(getScribeToken);

  const [typed, setTyped] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [items, setItems] = useState<SortedItem[]>([]);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    memories: number;
    updates: number;
    children: number;
  } | null>(null);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: "vad",
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
      <div className="paper rounded-3xl border bg-card p-6 text-center">
        <h2 className="font-display text-xl">Just talk</h2>
        <p className="mx-auto mt-1 max-w-xs text-sm text-muted-foreground">
          Mix everything together. Dossier sorts it into each child&apos;s story.
        </p>

        <button
          type="button"
          onClick={isRecording ? stop : start}
          disabled={isSorting}
          className="mx-auto mt-6 grid size-24 place-items-center rounded-full text-white shadow-lg transition-transform active:scale-95 disabled:opacity-60"
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
        </button>

        <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
          {isSorting
            ? "Sorting…"
            : isRecording
              ? "Listening — tap to stop"
              : "Tap the mic and speak"}
        </p>

        {(isRecording || liveTranscript) && (
          <p className="mt-4 min-h-16 rounded-2xl bg-muted/60 p-4 text-left text-sm leading-relaxed">
            {liveTranscript || "…"}
          </p>
        )}

        <button
          type="button"
          onClick={() => setShowTyping((value) => !value)}
          className="mt-4 text-xs text-muted-foreground underline underline-offset-4"
        >
          {showTyping ? "Hide typing" : "Type instead"}
        </button>

        {showTyping && (
          <div className="mt-3 space-y-2 text-left">
            <textarea
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              rows={4}
              placeholder="Luca tried mango today and his lips got a bit swollen…"
              className="w-full rounded-2xl border bg-background p-3 text-sm outline-none focus:ring-2"
              style={{ boxShadow: "none" }}
            />
            <button
              type="button"
              onClick={() => sort(typed, "text")}
              disabled={isSorting || !typed.trim()}
              className="w-full rounded-full py-2.5 text-sm font-medium text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--child)" }}
            >
              Sort this
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {kids.map((kid) => (
          <div
            key={kid.id}
            className="min-h-40 rounded-3xl border p-3"
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
                      className="rounded-xl bg-card p-2.5 text-left text-xs shadow-sm"
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
          className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3 text-sm"
        >
          <span>
            {summary.memories} {summary.memories === 1 ? "memory" : "memories"} ·{" "}
            {summary.updates} profile {summary.updates === 1 ? "update" : "updates"} ·{" "}
            {summary.children} {summary.children === 1 ? "child" : "children"}
          </span>
          <button
            type="button"
            onClick={undo}
            className="flex items-center gap-1 text-muted-foreground underline underline-offset-4"
          >
            <Undo2 className="size-3.5" /> Undo
          </button>
        </motion.div>
      )}
    </section>
  );
}
