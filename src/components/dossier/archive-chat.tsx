import { useServerFn } from "@tanstack/react-start";
import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AiRing } from "@/components/dossier/ai-ring";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
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

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const send = useCallback(
    async (text: string) => {
      const question = text.trim();
      if (!question || busy || !active) return;
      const next: Turn[] = [
        ...turns,
        { id: crypto.randomUUID(), role: "user", content: question },
      ];
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

  const names = kids.length
    ? kids.map((kid) => kid.name).join(" and ")
    : "your child";

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <AiRing className="size-8" />
          <div>
            <h2 className="font-display text-base leading-tight">Ask Dossier</h2>
            <p className="text-xs text-muted-foreground">
              Every memory, fact and document for {active?.name ?? names}
            </p>
          </div>
        </div>
        {turns.length > 0 && (
          <button
            type="button"
            onClick={() => setTurns([])}
            className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs text-ink-2"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            New chat
          </button>
        )}
      </header>

      <Conversation className="max-h-[46vh] min-h-[220px]">
        <ConversationContent className="gap-4 px-5 py-5">
          {turns.length === 0 && !busy ? (
            <ConversationEmptyState
              className="gap-3 py-4"
              title={`Ask anything about ${names}`}
              description="Answers come only from what you have already saved."
            >
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => void send(suggestion)}
                    className="rounded-lg border border-line bg-surface-2 px-3 py-1.5 text-xs text-ink-2"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            turns.map((turn) => (
              <Message key={turn.id} from={turn.role}>
                <MessageContent>
                  {turn.role === "assistant" ? (
                    <MessageResponse>{turn.content}</MessageResponse>
                  ) : (
                    turn.content
                  )}
                </MessageContent>
              </Message>
            ))
          )}

          {busy && (
            <div className="flex items-center gap-3">
              <AiRing className="size-6" active />
              <Shimmer className="text-sm">Reading the archive…</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-line p-3">
        <PromptInput
          onSubmit={(message, event) => {
            event.preventDefault();
            const text = message.text ?? "";
            event.currentTarget.reset();
            void send(text);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            placeholder={`Ask about ${active?.name ?? names}…`}
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={busy ? "submitted" : undefined}
              disabled={busy || !active}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}
