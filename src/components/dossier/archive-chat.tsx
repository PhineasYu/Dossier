import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, AudioLines, Plus, RotateCcw } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { AiBuddy } from "@/components/dossier/buddy";
import { Button } from "@/components/ui/button";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { chatArchive } from "@/lib/dossier.functions";
import { planAssistantTasks } from "@/lib/assistant-tasks.functions";
import { type TaskAction } from "@/lib/assistant-tasks";
import { AssistantPlan } from "@/components/dossier/assistant-plan";
import { isGuest } from "@/lib/guest";
import { useChildren } from "@/lib/child-context";

type Turn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  proposalIds?: string[];
  actions?: TaskAction[];
};

const SUGGESTIONS = [
  "What allergies should a babysitter know?",
  "What have they been afraid of lately?",
  "How much have they grown this year?",
];

export function ArchiveChat({
  compact = false,
  onCapture,
}: {
  compact?: boolean | undefined;
  onCapture?: ((mode: "voice" | "text") => void) | undefined;
}) {
  const { active, kids } = useChildren();
  const ask = useServerFn(chatArchive);
  const plan = useServerFn(planAssistantTasks);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy || !active) return;
      const next: Turn[] = [...turns, { id: crypto.randomUUID(), role: "user", content: question }];
      setTurns(next);
      setBusy(true);
      try {
        const result: { answer: string; proposalIds?: string[]; actions?: TaskAction[] } =
          compact && !isGuest()
            ? await plan({
                data: {
                  childId: active.id,
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  messages: next.map(({ role, content }) => ({ role, content })),
                },
              })
            : await ask({
                data: {
                  childId: active.id,
                  messages: next.map(({ role, content }) => ({ role, content })),
                },
              });
        setTurns((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: result.answer,
            ...(result.proposalIds?.length && result.actions?.length
              ? { proposalIds: result.proposalIds, actions: result.actions }
              : {}),
          },
        ]);
      } catch (error) {
        setTurns((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content:
              error instanceof Error
                ? error.message
                : "Something went wrong reaching the archive. Please try again.",
          },
        ]);
      } finally {
        setBusy(false);
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    },
    [active, ask, plan, compact, busy, turns],
  );

  const names = kids.length ? kids.map((kid) => kid.name).join(" and ") : "your child";
  const name = active?.name ?? names;

  return (
    <section
      className={`flex min-w-0 flex-col rounded-3xl bg-action-soft ${compact ? "gap-3 p-4 sm:p-5" : "gap-5 p-5 sm:p-6"}`}
      aria-label="Ask Dossier conversation"
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 sm:gap-3">
        <div className="shrink-0">
          <AiBuddy size={compact ? 36 : 52} />
        </div>
        <div className="min-w-0">
          <h2
            className={`${compact ? "text-[20px]" : "text-[24px]"} text-pretty font-bold leading-snug text-ink`}
          >
            {compact ? "What should Dossier do?" : `Ask anything about ${name}`}
          </h2>
        </div>
        {turns.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label="New chat"
            title="New chat"
            onClick={() => setTurns([])}
          >
            <RotateCcw aria-hidden="true" />
          </Button>
        )}
      </div>

      {turns.length === 0 && !busy ? (
        compact ? null : (
          <div>
            <ul className="divide-y divide-paper/80">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="h-auto min-h-14 w-full justify-between gap-3 whitespace-normal rounded-none px-0 py-3 text-left text-[15px] font-normal leading-snug text-ink hover:bg-transparent hover:text-action-ink"
                  >
                    <span>{suggestion}</span>
                    <ArrowUpRight className="shrink-0 text-action-ink" aria-hidden="true" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        <Conversation className={compact ? "max-h-72 min-h-24" : "max-h-[52vh] min-h-[200px]"}>
          <ConversationContent className="gap-4 px-0 py-2">
            {turns.map((turn) => (
              <Message key={turn.id} from={turn.role}>
                <MessageContent className={turn.role === "user" ? "bg-paper text-ink" : undefined}>
                  {turn.role === "assistant" ? (
                    <>
                      <MessageResponse>{turn.content}</MessageResponse>
                      {turn.proposalIds && turn.actions && (
                        <AssistantPlan ids={turn.proposalIds} actions={turn.actions} />
                      )}
                    </>
                  ) : (
                    turn.content
                  )}
                </MessageContent>
              </Message>
            ))}
            {busy && (
              <div className="flex items-center gap-3">
                <AiBuddy size={28} motion="wiggle" />
                <Shimmer className="text-sm">
                  {compact ? "Working on it…" : "Reading the archive…"}
                </Shimmer>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      <div className="[&_[data-slot=input-group]]:rounded-2xl [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-paper [&_[data-slot=input-group]]:shadow-none">
        <PromptInput
          onSubmit={(message, event) => {
            event.preventDefault();
            const text = message.text ?? "";
            void send(text);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            placeholder={compact ? `Ask, plan or remind me…` : `Ask about ${name}…`}
            aria-label={compact ? "Tell Dossier what you need" : `Ask about ${name}`}
            className={compact ? "min-h-14 px-4 py-3 text-[17px] leading-normal" : undefined}
          />
          <PromptInputFooter className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 px-3 pb-2 pt-0">
            {compact && onCapture ? (
              <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-1 sm:flex">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onCapture("text")}
                  aria-label="Save a moment"
                  title="Save a moment"
                  className="h-11 min-w-0 justify-start gap-1.5 px-1 text-[16px] font-normal sm:px-2"
                >
                  <Plus aria-hidden="true" />
                  <span className="sm:hidden">Save</span>
                  <span className="hidden sm:inline">Save a moment</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                  onClick={() => onCapture("voice")}
                  aria-label="Tell Dossier by voice"
                  title="Tell Dossier by voice"
                >
                  <AudioLines aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <span />
            )}
            <PromptInputSubmit
              className="size-11 shrink-0 rounded-full bg-action-button text-on-action hover:bg-action-button-hover"
              {...(busy ? { status: "submitted" as const } : {})}
              disabled={busy || !active}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}
