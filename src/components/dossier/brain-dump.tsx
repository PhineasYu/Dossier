import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { AudioLines, Loader2, Square, Undo2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { AiBuddy, Buddy } from "@/components/dossier/buddy";
import type { Prompt } from "@/components/dossier/prompt-deck";
import { captureEntry, getScribeToken, undoEntry } from "@/lib/dossier.functions";
import { useChildren } from "@/lib/child-context";
import { CATEGORY_LABEL, FIELD_LABEL } from "@/lib/dossier";

type SortedItem = {
  id: string;
  childId: string;
  kind: "card" | "fact";
  label: string;
  text: string;
};

export function BrainDump({
  initialMode,
  prompt,
  onClearPrompt,
}: {
  initialMode: "voice" | "text" | undefined;
  /** A prompt card the parent chose; it gives the AI context and keeps the question chip. */
  prompt?: Prompt | null | undefined;
  onClearPrompt?: (() => void) | undefined;
}) {
  const { kids, lookOf } = useChildren();
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
        const result = await runCapture({
          data: {
            transcript: prompt ? `${prompt.text} — ${transcript}` : transcript,
            source,
            ...(prompt?.origin ? { questionOrigin: prompt.origin } : {}),
          },
        });
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
    [queryClient, runCapture, prompt],
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
  const plural = (count: number, one: string, many: string) =>
    `${count} ${count === 1 ? one : many}`;

  return (
    <section className="space-y-3">
      <div className="tile p-5">
        {prompt && (
          <div className="mb-4 flex items-start gap-2 rounded-2xl bg-paper px-4 py-3">
            <p className="flex-1 text-[15px] leading-snug">
              <span className="block text-[13px] font-semibold text-ink-3">Answering</span>
              {prompt.text}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClearPrompt}
              aria-label="Clear the prompt"
            >
              <X />
            </Button>
          </div>
        )}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ai"
            onClick={isRecording ? stop : start}
            disabled={isSorting}
            size="icon"
            className="size-16 shrink-0 [&_svg]:size-7"
            aria-label={isRecording ? "Stop and sort" : "Start talking"}
          >
            {isSorting ? (
              <Loader2 className="animate-spin" />
            ) : isRecording ? (
              <Square />
            ) : (
              <AudioLines />
            )}
          </Button>
          <div className="min-w-0" aria-live="polite">
            <p className="text-[15px] font-semibold">
              {isSorting
                ? "Sorting into each child's story…"
                : isRecording
                  ? "Listening. Tap to stop."
                  : "Tap and tell Dossier anything"}
            </p>
            <p className="mt-0.5 text-[13px] leading-snug text-ink-3">
              &ldquo;Lucy was nervous before swimming. Luca&apos;s teacher says he shares his toys
              now.&rdquo;
            </p>
          </div>
          {isSorting && <AiBuddy size={44} motion="wiggle" className="ml-auto" />}
        </div>

        {(isRecording || liveTranscript) && (
          <p className="mt-4 min-h-16 rounded-2xl bg-paper p-4 text-left text-[15px] leading-relaxed">
            {liveTranscript || "…"}
          </p>
        )}

        {showTyping && (
          <div className="mt-4 space-y-2">
            <textarea
              value={typed}
              onChange={(event) => setTyped(event.target.value)}
              rows={4}
              placeholder="Luca tried mango today and his lips got a bit swollen…"
              aria-label="Type everything from today"
              className="w-full rounded-2xl bg-paper p-4 text-[15px] outline-none placeholder:text-ink-3 focus:ring-2 focus:ring-action-ink"
            />
            <Button
              type="button"
              variant="ai"
              onClick={() => sort(typed, "text")}
              disabled={isSorting || !typed.trim()}
              className="w-full"
            >
              Sort it for me
            </Button>
          </div>
        )}

        <Button
          type="button"
          onClick={() => setShowTyping((value) => !value)}
          variant="ghost"
          size="sm"
          className="-ml-2 mt-3"
        >
          {showTyping ? "Hide the keyboard" : "Type instead"}
        </Button>
      </div>

      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {kids.map((kid) => {
            const look = lookOf(kid.id);
            return (
              <div
                key={kid.id}
                className="min-h-36 rounded-3xl p-3"
                style={{ backgroundColor: look.soft }}
              >
                <p className="mb-2 flex items-center gap-2 text-[15px] font-bold">
                  <Buddy shape={look.shape} color={look.body} size={26} />
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
                          transition={{
                            delay: index * 0.25,
                            type: "spring",
                            stiffness: 220,
                            damping: 22,
                          }}
                          className="rounded-2xl bg-paper p-3 text-left text-sm leading-snug"
                        >
                          <span className="block text-xs font-semibold" style={{ color: look.ink }}>
                            {item.kind === "card" ? item.label : `${item.label} updated`}
                          </span>
                          {item.text}
                        </motion.li>
                      ))}
                  </AnimatePresence>
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {summary && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: items.length * 0.25 + 0.2 }}
          className="tile flex items-center justify-between gap-3 px-5 py-3 text-[15px]"
        >
          <span>
            {plural(summary.memories, "memory", "memories")} and{" "}
            {plural(summary.updates, "profile update", "profile updates")} for{" "}
            {plural(summary.children, "child", "children")}
          </span>
          <Button type="button" onClick={undo} variant="outline" size="sm">
            <Undo2 /> Undo
          </Button>
        </motion.div>
      )}
    </section>
  );
}
