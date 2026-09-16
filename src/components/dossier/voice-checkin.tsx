import { useConversation } from "@elevenlabs/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2, Mic, MicOff, PhoneOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { DailyCheckin } from "@/components/dossier/daily-checkin";
import { AiRing } from "@/components/dossier/ai-ring";
import { Button } from "@/components/ui/button";
import {
  captureEntry,
  getCheckinConversationToken,
  getTodayCheckin,
  getTodayCheckinAuthenticated,
  saveTodayCheckin,
  saveTodayCheckinAuthenticated,
} from "@/lib/dossier.functions";
import { useChildren } from "@/lib/child-context";
import { ageAt, CATEGORY_LABEL, type MemoryCard } from "@/lib/dossier";
import { isGuest } from "@/lib/guest";
import { supabase } from "@/integrations/supabase/client";

type Answer = { question: "for_child" | "child_moment"; text: string };
type Caption = { id: number; role: "user" | "agent"; text: string };

export function VoiceCheckin() {
  const { kids, active } = useChildren();
  const queryClient = useQueryClient();
  const fetchGuest = useServerFn(getTodayCheckin);
  const fetchAuthenticated = useServerFn(getTodayCheckinAuthenticated);
  const saveGuest = useServerFn(saveTodayCheckin);
  const saveAuthenticated = useServerFn(saveTodayCheckinAuthenticated);
  const getToken = useServerFn(getCheckinConversationToken);
  const runCapture = useServerFn(captureEntry);
  const [guest, setGuest] = useState(true);
  const [parentName, setParentName] = useState("there");
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState<"idle" | "connecting" | "talking" | "summary" | "fallback">("idle");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [createdCards, setCreatedCards] = useState<MemoryCard[]>([]);
  const [saving, setSaving] = useState(false);
  const answersRef = useRef<Answer[]>([]);
  const cardsRef = useRef<MemoryCard[]>([]);

  useEffect(() => {
    const guestMode = isGuest();
    setGuest(guestMode);
    if (!guestMode) {
      supabase.auth.getUser().then(({ data }) => {
        const metadata = data.user?.user_metadata as { full_name?: string; name?: string } | undefined;
        setParentName(metadata?.full_name?.split(" ")[0] ?? metadata?.name?.split(" ")[0] ?? "there");
      });
    }
  }, []);

  const todayQuery = useQuery({
    queryKey: ["today-checkin", guest],
    queryFn: () => (guest ? fetchGuest({}) : fetchAuthenticated({})),
  });

  const persist = useCallback(
    async (complete: boolean, nextAnswers = answersRef.current, nextCards = cardsRef.current) => {
      const data = { answers: nextAnswers, createdCardIds: nextCards.map((card) => card.id), complete };
      if (guest) await saveGuest({ data });
      else await saveAuthenticated({ data });
      await queryClient.invalidateQueries({ queryKey: ["today-checkin"] });
    },
    [guest, queryClient, saveAuthenticated, saveGuest],
  );

  const finish = useCallback(async () => {
    await persist(true);
    setPhase("summary");
    await queryClient.invalidateQueries({ queryKey: ["cards"] });
  }, [persist, queryClient]);

  const conversation = useConversation({
    onMessage: ({ message, role, event_id }) => {
      setCaptions((current) => [
        ...current,
        { id: event_id ?? Date.now() + current.length, role, text: message },
      ]);
    },
    onError: () => {
      if (phase !== "summary") setPhase("fallback");
    },
    clientTools: {
      save_moment: async (parameters: Record<string, unknown>) => {
        const question = parameters["question"] === "child_moment" ? "child_moment" : "for_child";
        const text = String(parameters["text"] ?? "").trim();
        if (!text) return "No answer was provided.";
        setSaving(true);
        try {
          const context = active ? `About ${active.name}: ` : "";
          const result = await runCapture({ data: { transcript: context + text, source: "voice", questionOrigin: question } });
          const nextAnswers: Answer[] = [
            ...answersRef.current.filter((item) => item.question !== question),
            { question, text },
          ];
          const nextCards = [...cardsRef.current, ...(result.cards as MemoryCard[])];
          answersRef.current = nextAnswers;
          cardsRef.current = nextCards;
          setAnswers(nextAnswers);
          setCreatedCards(nextCards);
          await persist(false, nextAnswers, nextCards);
          await queryClient.invalidateQueries({ queryKey: ["cards"] });
          return `Saved ${result.cards.length} memories and ${result.facts.length} profile updates.`;
        } finally {
          setSaving(false);
        }
      },
      end_checkin: async () => {
        await finish();
        window.setTimeout(() => conversation.endSession(), 900);
      },
    },
  });

  const start = useCallback(async () => {
    setOpen(true);
    setPhase("connecting");
    setCaptions([]);
    setAnswers([]);
    setCreatedCards([]);
    answersRef.current = [];
    cardsRef.current = [];
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const { token } = await getToken({});
      const children = kids
        .map((child) => {
          const age = ageAt(child.birthdate, new Date().toISOString().slice(0, 10));
          return age === null ? child.name : `${child.name}, age ${age}`;
        })
        .join("; ");
      await conversation.startSession({
        conversationToken: token,
        connectionType: "webrtc",
        dynamicVariables: {
          parent_name: parentName,
          children,
          today: new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
        },
      });
      setPhase("talking");
    } catch {
      setPhase("fallback");
    }
  }, [conversation, getToken, kids, parentName]);

  const endEarly = useCallback(async () => {
    conversation.endSession();
    await finish();
  }, [conversation, finish]);

  const questionNumber = Math.min(answers.length + 1, 2);
  const completed = todayQuery.data?.completed ?? false;
  const activeColor = active?.theme_color ?? "var(--primary)";
  const orbAnimation = conversation.isSpeaking
    ? { scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }
    : conversation.isListening
      ? { boxShadow: [`0 0 0 0 var(--child-soft)`, `0 0 0 28px transparent`] }
      : {};

  return (
    <section className="pt-5">
      {!dismissed && <div className="material-card overflow-hidden p-5">
        {completed ? (
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid size-9 place-items-center rounded-full bg-child-soft text-child">
              <Check className="size-5" />
            </span>
            Today&apos;s check-in done
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <AiRing className="size-16 shrink-0">
              <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 2.4, repeat: Infinity }} className="grid size-full place-items-center rounded-full text-primary-foreground" style={{ backgroundColor: activeColor }}><Radio className="size-6" /></motion.div>
            </AiRing>
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold">Dossier has 2 questions for you</h2>
              <p className="mt-1 text-xs text-muted-foreground">Your mic lets Dossier listen and answer out loud.</p>
              <div className="mt-3 flex items-center gap-2">
                <Button onClick={start}>
                  <Mic className="size-4" /> Talk now
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>Later</Button>
              </div>
            </div>
          </div>
        )}
      </div>}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-background"
            role="dialog"
            aria-modal="true"
            aria-label="Today's voice check-in"
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Today&apos;s check-in</p>
                <p className="font-semibold">Question {questionNumber} of 2</p>
              </div>
              <div className="flex gap-2">
                {phase === "talking" && (
                  <Button variant="outline" size="icon" onClick={() => conversation.setMuted(!conversation.isMuted)} aria-label={conversation.isMuted ? "Unmute" : "Mute"}>
                    {conversation.isMuted ? <MicOff /> : <Mic />}
                  </Button>
                )}
                <Button variant="outline" onClick={phase === "talking" ? endEarly : () => setOpen(false)}>
                  <PhoneOff /> {phase === "talking" ? "End" : "Close"}
                </Button>
              </div>
            </header>

            <div className="mx-auto flex w-full max-w-xl flex-1 flex-col overflow-hidden px-5 py-5">
              {phase === "connecting" && (
                <div className="grid flex-1 place-items-center text-center">
                  <div><Loader2 className="mx-auto size-10 animate-spin text-child" /><p className="mt-4">Connecting Dossier…</p></div>
                </div>
              )}

              {phase === "talking" && (
                <>
                  <div className="grid place-items-center py-5">
                    <AiRing active={conversation.isSpeaking || saving} className="size-32">
                      <motion.div animate={orbAnimation} transition={{ duration: 1.25, repeat: Infinity }} className="grid size-full place-items-center rounded-full text-primary-foreground" style={{ backgroundColor: activeColor }}>
                        {saving ? <Loader2 className="size-8 animate-spin" /> : conversation.isSpeaking ? "Dossier" : "Listening"}
                      </motion.div>
                    </AiRing>
                    <p className="mt-3 text-xs font-semibold uppercase text-muted-foreground">
                      {conversation.isSpeaking ? "Dossier is speaking" : conversation.isMuted ? "Microphone muted" : "Your turn"}
                    </p>
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-5" aria-live="polite">
                    {captions.map((caption) => (
                      <Message key={caption.id} from={caption.role === "agent" ? "assistant" : "user"}>
                        <MessageContent className={caption.role === "user" ? "bg-child-soft text-foreground" : undefined}>
                          <MessageResponse>{caption.text}</MessageResponse>
                        </MessageContent>
                      </Message>
                    ))}
                    <AnimatePresence>
                      {createdCards.map((card, index) => {
                        const child = kids.find((item) => item.id === card.child_id);
                        return (
                          <motion.article key={card.id} initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: index * 0.12, type: "spring" }} className="material-card ml-8 p-4">
                            <div className="flex gap-2 text-[11px] font-semibold uppercase text-muted-foreground"><span>{child?.name ?? active?.name}</span><span>·</span><span>{CATEGORY_LABEL[card.category] ?? card.category}</span></div>
                            <p className="mt-1 text-sm font-semibold">{card.title}</p>
                          </motion.article>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {phase === "fallback" && (
                <div className="overflow-y-auto">
                  <div className="mb-5 rounded-xl border border-line bg-surface-2 p-4">
                    <h2 className="font-semibold">Voice isn&apos;t available right now</h2>
                    <p className="mt-1 text-sm text-muted-foreground">You can still answer both questions with the existing mic or type instead.</p>
                  </div>
                  <DailyCheckin streak={1} />
                </div>
              )}

              {phase === "summary" && (
                <div className="overflow-y-auto pb-8">
                  <div className="py-6 text-center"><span className="mx-auto grid size-16 place-items-center rounded-full bg-success text-primary-foreground"><Check className="size-8" /></span><h2 className="mt-4 text-2xl font-semibold">Today is written down</h2></div>
                  <div className="space-y-3">
                    {answers.map((answer, index) => <div key={answer.question} className="material-card p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Question {index + 1}</p><p className="mt-2 text-sm">{answer.text}</p></div>)}
                    {createdCards.map((card) => <div key={card.id} className="material-card p-4"><p className="text-xs font-semibold uppercase text-muted-foreground">Memory created</p><p className="mt-1 font-semibold">{card.title}</p></div>)}
                  </div>
                  <Button onClick={() => setOpen(false)} className="mt-5 w-full">Back to today</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}