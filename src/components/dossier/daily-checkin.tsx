import { CommitStrategy, useScribe } from "@elevenlabs/react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { Check, Flame, Loader2, Mic, Square } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { captureEntry, getScribeToken } from "@/lib/dossier.functions";
import { useChildren } from "@/lib/child-context";

const QUESTIONS = [
  "What did you do for your kids today?",
  "What did your kids do today that you want to remember?",
] as const;

export function DailyCheckin({ streak }: { streak: number }) {
  const { active } = useChildren();
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
        const prefix = `${QUESTIONS[step]}${active ? ` (about ${active.name})` : ""} — `;
        await runCapture({ data: { transcript: prefix + answer.trim(), source, questionOrigin: step === 0 ? "for_child" : "child_moment" } });
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
    [queryClient, runCapture, active, step],
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
      <div className="material-card flex items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2 text-sm">
          <Flame className="size-4 text-orange-ink" />
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
                  ? index === 0 ? "var(--orange)" : "var(--green)"
                  : index === step
                    ? index === 0 ? "var(--orange-100)" : "var(--green-100)"
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
            className="material-card p-8 text-center"
          >
            <div
              className="mx-auto grid size-16 place-items-center rounded-full bg-success text-primary-foreground"
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
            className="material-card p-6 text-center"
          >
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Question {step + 1} of {QUESTIONS.length}
            </p>
            <h2 className="mx-auto mt-3 max-w-xs font-display text-2xl leading-snug">
              {QUESTIONS[step]}
            </h2>

            <Button
              type="button"
              onClick={isRecording ? stop : start}
              disabled={isSaving}
              size="icon"
              className={`mx-auto mt-7 size-28 rounded-full [&_svg]:size-10 ${step === 0 ? "bg-orange text-ink" : "bg-green text-ink"}`}
              aria-label={isRecording ? "Stop and save" : "Answer out loud"}
            >
              {isSaving ? (
                <Loader2 className="size-10 animate-spin" />
              ) : isRecording ? (
                <Square className="size-9" />
              ) : (
                <Mic className="size-10" />
              )}
            </Button>

            <p className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
              {isSaving
                ? "Saving…"
                : isRecording
                  ? "Listening — tap to finish"
                  : "Tap and answer out loud"}
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
                  rows={3}
                  placeholder="We read two chapters before bed…"
                  className="w-full rounded-xl border border-outline bg-surface-container-low p-4 text-sm outline-none focus:ring-2 focus:ring-ring"
                  style={{ boxShadow: "none" }}
                />
                <Button
                  type="button"
                  onClick={() => save(typed, "text")}
                  disabled={isSaving || !typed.trim()}
                  className="w-full"
                >
                  Save this answer
                </Button>
              </div>
            )}

            {step === 0 && (
              <Button
                type="button"
                onClick={() => setStep(1)}
                variant="ghost"
                size="sm"
                className="mt-5 w-full text-xs text-on-surface-variant"
              >
                Skip to the next question
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
