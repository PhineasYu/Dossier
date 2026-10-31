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

type Turn = { id: string; role: "user" | "assistant"; content: string; proposalId?: string | null; actions?: TaskAction[] };

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
        const result = compact && !isGuest() ? await plan({data:{childId:active.id, timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,messages:next.map(({role,content})=>({role,content}))}}) : await ask({
          data: {
            childId: active.id,
            messages: next.map(({ role, content }) => ({ role, content })),
          },
        });
        setTurns((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "assistant", content: result.answer, ...("proposalId" in result ? {proposalId:result.proposalId,actions:result.actions} : {}) },
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
    [active, ask, busy, turns],
  );

  const names = kids.length ? kids.map((kid) => kid.name).join(" and ") : "your child";
  const name = active?.name ?? names;

  return (
    <section
      className={`flex flex-col rounded-3xl bg-action-soft p-5 sm:p-6 ${compact ? "gap-3" : "gap-5"}`}
      aria-label="Ask Dossier conversation"
    >
      <div className="flex flex-wrap items-start gap-3">
        <AiBuddy size={compact ? 40 : 52} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2
            className={`${compact ? "text-[20px]" : "text-[24px]"} font-bold leading-tight text-ink`}
          >
            {compact ? "What should Dossier do?" : `Ask anything about ${name}`}
          </h2>
        </div>
        {turns.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
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
                      {turn.proposalId && turn.actions && <AssistantPlan id={turn.proposalId} actions={turn.actions} />}
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
                <Shimmer className="text-sm">{compact ? "Working on it…" : "Reading the archive…"}</Shimmer>
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
            className={compact ? "min-h-12" : undefined}
          />
          <PromptInputFooter className="justify-between">
            {compact && onCapture ? (
              <div className="flex min-w-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onCapture("text")}
                  className="px-2 text-[14px]"
                >
                  <Plus aria-hidden="true" /> Save a moment
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
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
              className="shrink-0 rounded-full bg-action-button text-on-action hover:bg-action-button-hover"
              {...(busy ? { status: "submitted" as const } : {})}
              disabled={busy || !active}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}
