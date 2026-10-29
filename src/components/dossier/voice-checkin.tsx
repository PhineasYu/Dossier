import { useConversation } from "@elevenlabs/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
import { AudioLines, Mic, MicOff, PhoneOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { BrainDump } from "@/components/dossier/brain-dump";
import { AiBuddy, Buddy } from "@/components/dossier/buddy";
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
  const { kids, active, lookOf } = useChildren();
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
  const [phase, setPhase] = useState<"idle" | "connecting" | "talking" | "summary" | "fallback">(
    "idle",
  );
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
        const metadata = data.user?.user_metadata as
          { full_name?: string; name?: string } | undefined;
        setParentName(
          metadata?.full_name?.split(" ")[0] ?? metadata?.name?.split(" ")[0] ?? "there",
        );
      });
    }
  }, []);

  const todayQuery = useQuery({
    queryKey: ["today-checkin", guest],
    queryFn: () => (guest ? fetchGuest({}) : fetchAuthenticated({})),
  });

  const persist = useCallback(
    async (complete: boolean, nextAnswers = answersRef.current, nextCards = cardsRef.current) => {
      const data = {
        answers: nextAnswers,
        createdCardIds: nextCards.map((card) => card.id),
        complete,
      };
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
          const result = await runCapture({
            data: { transcript: context + text, source: "voice", questionOrigin: question },
          });
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
          today: new Date().toLocaleDateString("en-GB", {
            weekday: "long",
            day: "numeric",
            month: "long",
          }),
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
  const look = lookOf(active?.id);
  const aiMotion = saving ? "wiggle" : conversation.isSpeaking ? "squash" : "bob";

  return (
    <section>
      {!dismissed && (
        <div className="rounded-3xl bg-action-soft p-5">
          {completed ? (
            <div className="flex items-center gap-3">
              <Buddy shape={look.shape} color={look.body} size={44} smile />
              <div>
                <p className="text-[15px] font-bold">Today is kept</p>
                <p className="text-[13px] text-ink-3">Come back whenever something happens.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <AiBuddy size={64} limbs className="mt-1" />
              <div className="min-w-0 flex-1">
                <h2 className="text-[17px] font-bold">Talk to Dossier</h2>
                <p className="mt-0.5 text-[14px] leading-snug text-ink-2">
                  Tell it about anyone in the family. If you don't know where to start, it will ask
                  you something.
                </p>
                <div className="mt-3 flex items-center gap-1">
                  <Button onClick={start} variant="ai" size="sm" className="h-10 px-5">
                    <AudioLines /> Talk now
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10"
                    onClick={() => setDismissed(true)}
                  >
                    Later
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-paper"
            role="dialog"
            aria-modal="true"
            aria-label="Tonight's voice check-in"
          >
            <header className="flex items-center justify-between px-5 pb-2 pt-5">
              <p className="text-[15px] font-semibold text-ink-2">Question {questionNumber} of 2</p>
              <div className="flex gap-2">
                {phase === "talking" && (
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    onClick={() => conversation.setMuted(!conversation.isMuted)}
                    aria-label={conversation.isMuted ? "Unmute" : "Mute"}
                  >
                    {conversation.isMuted ? <MicOff /> : <Mic />}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={phase === "talking" ? endEarly : () => setOpen(false)}
                >
                  <PhoneOff /> {phase === "talking" ? "End" : "Close"}
                </Button>
              </div>
            </header>

            <div className="mx-auto flex w-full max-w-xl flex-1 flex-col overflow-hidden px-5 pb-5">
              {phase === "connecting" && (
                <div className="grid flex-1 place-items-center text-center">
                  <div className="flex flex-col items-center">
                    <AiBuddy size={120} limbs motion="bob" />
                    <p className="mt-4 text-[15px] font-semibold">Calling Dossier…</p>
                  </div>
                </div>
              )}

              {phase === "talking" && (
                <>
                  <div className="flex flex-col items-center py-4">
                    <div className="relative">
                      <AiBuddy size={150} limbs motion={aiMotion} />
                    </div>
                    <p className="mt-3 text-[15px] font-semibold" aria-live="polite">
                      {saving
                        ? "Filing that…"
                        : conversation.isSpeaking
                          ? "Dossier is asking"
                          : conversation.isMuted
                            ? "Microphone is off"
                            : "Your turn. Just talk."}
                    </p>
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-5" aria-live="polite">
                    {captions.map((caption) => (
                      <Message
                        key={caption.id}
                        from={caption.role === "agent" ? "assistant" : "user"}
                      >
                        <MessageContent
                          className={caption.role === "user" ? "bg-child-soft text-ink" : undefined}
                        >
                          <MessageResponse>{caption.text}</MessageResponse>
                        </MessageContent>
                      </Message>
                    ))}
                    <AnimatePresence>
                      {createdCards.map((card, index) => {
                        const child = kids.find((item) => item.id === card.child_id);
                        const cardLook = lookOf(card.child_id);
                        return (
                          <motion.article
                            key={card.id}
                            initial={{ opacity: 0, y: 40, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.12, type: "spring" }}
                            className="ml-8 flex items-center gap-3 rounded-3xl p-4"
                            style={{ backgroundColor: cardLook.soft }}
                          >
                            <Buddy shape={cardLook.shape} color={cardLook.body} size={32} />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold" style={{ color: cardLook.ink }}>
                                {child?.name ?? active?.name},{" "}
                                {CATEGORY_LABEL[card.category] ?? card.category}
                              </p>
                              <p className="text-[15px] font-semibold leading-snug">{card.title}</p>
                            </div>
                          </motion.article>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {phase === "fallback" && (
                <div className="overflow-y-auto pt-2">
                  <div className="tile mb-4 p-5">
                    <h2 className="text-[17px] font-bold">Voice isn&apos;t available right now</h2>
                    <p className="mt-1 text-[15px] text-ink-2">
                      Answer the same two questions with the mic button or by typing.
                    </p>
                  </div>
                  <BrainDump initialMode={undefined} />
                </div>
              )}

              {phase === "summary" && (
                <div className="overflow-y-auto pb-8">
                  <div className="flex flex-col items-center py-6 text-center">
                    <Buddy
                      shape={look.shape}
                      color={look.body}
                      size={110}
                      limbs
                      smile
                      motion="bob"
                    />
                    <h2 className="display mt-4 text-[44px]">Today is written down</h2>
                  </div>
                  <div className="space-y-3">
                    {answers.map((answer, index) => (
                      <div
                        key={answer.question}
                        className={`rounded-3xl p-5 ${index === 0 ? "bg-q1-soft" : "bg-q2-soft"}`}
                      >
                        <p className="text-[13px] font-semibold text-ink-2">Question {index + 1}</p>
                        <p className="mt-1 text-[15px]">{answer.text}</p>
                      </div>
                    ))}
                    {createdCards.map((card) => (
                      <div key={card.id} className="tile p-5">
                        <p className="text-[13px] font-semibold text-ink-3">New memory</p>
                        <p className="mt-1 text-[15px] font-semibold">{card.title}</p>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => setOpen(false)} size="lg" className="mt-5 w-full">
                    Back to the story
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
