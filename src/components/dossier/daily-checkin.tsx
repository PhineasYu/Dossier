import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { Check, Flame, Loader2, Mic, Square } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { captureEntry, getScribeToken } from "@/lib/dossier.functions";
import { useChildren } from "@/lib/child-context";

const QUESTIONS = [
  "What did you do for your child today?",
  "What did your child do today that you'll remember?",
] as const;

export function DailyCheckin({ streak }: { streak: number }) {
  const { selected } = useChildren();
  const queryClient = useQueryClient();
  const runCapture = useServerFn(captureEntry);
  const fetchToken = useServerFn(getScribeToken);

  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");
  const [showTyping, setShowTyping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState<number[]>([]);

  const scribe = useScribe({
    modelId: "scribe_v2_realtime",
    commitStrategy: CommitStrategy.VAD,
  });

  const liveTranscript = useMemo(() => {
    const committed = scribe.committedTranscripts.map((t) => t.text).join(" ");
    return [committed, scribe.partialTranscript].filter(Boolean).join(" ").trim();
  }, [scribe.committedTranscripts, scribe.partialTranscript]);

  const save = useCallback(
    async (answer: string, source: "voice" | "text") => {
      if (!answer.trim()) {
        toast.error("Nothing was captured — try again.");
        return;
      }
      setIsSaving(true);
      try {
        const prefix = `${QUESTIONS[step]}${selected ? ` (about ${selected.name})` : ""} — `;
        await runCapture({ data: { transcript: prefix + answer.trim(), source } });
        setSaved((list) => [...list, step]);
        setTyped("");
        setShowTyping(false);
        await queryClient.invalidateQueries();
        if (step < QUESTIONS.length - 1) setStep(step + 1);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not save that.");
      } finally {
        setIsSaving(false);
      }
    },
    [queryClient, runCapture, selected, step],
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
    const answer = liveTranscript;
    await scribe.disconnect();
    await save(answer, "voice");
  }, [liveTranscript, save, scribe]);

  const isRecording = scribe.isConnected;
  const allDone = saved.length >= QUESTIONS.length;

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3">
        <span className="flex items-center gap-2 text-sm">
          <Flame className="size-4" style={{ color: "var(--child)" }} />
          <strong className="font-display text-base">Day {Math.max(streak, 1)}</strong>
          <span className="text-muted-foreground">
            {streak > 1 ? "in a row" : "let’s start the streak"}
          </span>
        </span>
        <span className="flex gap-1.5">
          {QUESTIONS.map((question, index) => (
            <span
              key={question}
              className="size-2 rounded-full"
              style={{
                backgroundColor: saved.includes(index)
                  ? "var(--child)"
                  : index === step
                    ? "var(--child-soft)"
                    : "var(--muted)",
              }}
            />
          ))}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {allDone ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="paper rounded-3xl border bg-card p-8 text-center"
          >
            <div
              className="mx-auto grid size-16 place-items-center rounded-full text-white"
              style={{ backgroundColor: "var(--child)" }}
            >
              <Check className="size-8" />
            </div>
            <h2 className="mt-4 font-display text-xl">Today is written down</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Both answers are sorted into the story. Come back tomorrow to keep Day{" "}
              {Math.max(streak, 1) + 1} going.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="paper rounded-3xl border bg-card p-6 text-center"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Question {step + 1} of {QUESTIONS.length}
            </p>
            <h2 className="mx-auto mt-3 max-w-xs font-display text-2xl leading-snug">
              {QUESTIONS[step]}
            </h2>

            <button
              type="button"
              onClick={isRecording ? stop : start}
              disabled={isSaving}
              className="mx-auto mt-7 grid size-28 place-items-center rounded-full text-white shadow-lg transition-transform active:scale-95 disabled:opacity-60"
              style={{ backgroundColor: "var(--child)" }}
              aria-label={isRecording ? "Stop and save" : "Answer out loud"}
            >
              {isSaving ? (
                <Loader2 className="size-10 animate-spin" />
              ) : isRecording ? (
                <Square className="size-9" />
              ) : (
                <Mic className="size-10" />
              )}
            </button>

            <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
              {isSaving
                ? "Saving…"
                : isRecording
                  ? "Listening — tap to finish"
                  : "Tap and answer out loud"}
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
                  rows={3}
                  placeholder="We read two chapters before bed…"
                  className="w-full rounded-2xl border bg-background p-3 text-sm outline-none focus:ring-2"
                  style={{ boxShadow: "none" }}
                />
                <button
                  type="button"
                  onClick={() => save(typed, "text")}
                  disabled={isSaving || !typed.trim()}
                  className="w-full rounded-full py-2.5 text-sm font-medium text-white disabled:opacity-50"
                  style={{ backgroundColor: "var(--child)" }}
                >
                  Save this answer
                </button>
              </div>
            )}

            {step === 0 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="mt-5 block w-full text-xs text-muted-foreground"
              >
                Skip to the next question
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
