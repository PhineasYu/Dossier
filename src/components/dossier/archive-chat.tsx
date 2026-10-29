import { useServerFn } from "@tanstack/react-start";
import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
import { useChildren } from "@/lib/child-context";

type Turn = { id: string; role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What allergies should a babysitter know?",
  "What have they been afraid of lately?",
  "How much have they grown this year?",
];

export function ArchiveChat() {
  const { active, kids } = useChildren();
  const ask = useServerFn(chatArchive);
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
        const result = await ask({
          data: {
            childId: active.id,
            messages: next.map(({ role, content }) => ({ role, content })),
          },
        });
        setTurns((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "assistant", content: result.answer },
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
    <section className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <AiBuddy size={44} />
        <div className="min-w-0 flex-1 pt-0.5">
          <h2 className="text-[17px] font-bold leading-snug">Ask anything about {name}</h2>
          <p className="mt-0.5 text-[14px] leading-snug text-ink-2">
            Dossier answers only from what you have saved.
          </p>
        </div>
        {turns.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setTurns([])}>
            <RotateCcw aria-hidden="true" /> New
          </Button>
        )}
      </div>

      {turns.length === 0 && !busy ? (
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-3">Try asking</p>
          <ul className="space-y-2">
            {SUGGESTIONS.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  onClick={() => void send(suggestion)}
                  className="press w-full rounded-2xl bg-cloud px-4 py-3 text-left text-[15px] leading-snug text-ink"
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Conversation className="max-h-[52vh] min-h-[200px] rounded-3xl bg-cloud">
          <ConversationContent className="gap-4 px-4 py-5">
            {turns.map((turn) => (
              <Message key={turn.id} from={turn.role}>
                <MessageContent className={turn.role === "user" ? "bg-paper text-ink" : undefined}>
                  {turn.role === "assistant" ? (
                    <MessageResponse>{turn.content}</MessageResponse>
                  ) : (
                    turn.content
                  )}
                </MessageContent>
              </Message>
            ))}
            {busy && (
              <div className="flex items-center gap-3">
                <AiBuddy size={28} motion="wiggle" />
                <Shimmer className="text-sm">Reading the archive…</Shimmer>
              </div>
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      )}

      <div className="[&_[data-slot=input-group]]:rounded-3xl [&_[data-slot=input-group]]:border-0 [&_[data-slot=input-group]]:bg-cloud [&_[data-slot=input-group]]:shadow-none">
        <PromptInput
          onSubmit={(message, event) => {
            event.preventDefault();
            const text = message.text ?? "";
            event.currentTarget.reset();
            void send(text);
          }}
        >
          <PromptInputTextarea ref={textareaRef} placeholder={`Ask about ${name}…`} />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              className="rounded-full bg-action text-on-action hover:bg-action-hover"
              {...(busy ? { status: "submitted" as const } : {})}
              disabled={busy || !active}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}
