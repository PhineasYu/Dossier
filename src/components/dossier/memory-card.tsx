import { CATEGORY_LABEL, shortDate, type MemoryCard } from "@/lib/dossier";
import { CATEGORY_TINT } from "@/lib/palette";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, AudioLines, AlignLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/dossier";
import { MomentPreview, type MomentPreviewKind } from "./moment-preview";

const pillClass =
  "inline-flex h-7 items-center gap-1.5 rounded-full bg-paper px-2.5 text-[14px] font-normal leading-none text-ink-2";

const QUESTION_LABEL = {
  for_child: { text: "For them", dot: "bg-q1" },
  child_moment: { text: "Their moment", dot: "bg-q2" },
} as const;

function sentence(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function MemoryCardView({
  card,
  onCategoryChange,
  preview,
}: {
  card: MemoryCard;
  onCategoryChange?: ((category: string | null) => void) | undefined;
  preview?: MomentPreviewKind | undefined;
}) {
  const [open, setOpen] = useState(false);
  const {
    data: entry,
    isLoading: entryLoading,
    isError: entryError,
  } = useQuery({
    queryKey: ["memory-entry", card.entry_id],
    enabled: open && Boolean(card.entry_id),
    queryFn: async () => {
      if (!card.entry_id) return null;
      const { data, error } = await supabase
        .from("entries")
        .select("raw_text, source")
        .eq("id", card.entry_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const question = card.question_origin ? QUESTION_LABEL[card.question_origin] : null;
  return (
    <>
      <article className={`relative rounded-3xl px-5 pb-5 pt-3 ${CATEGORY_TINT[card.category] ?? "bg-cloud"}`}>
        <Button
          variant="ghost"
          className="absolute inset-0 h-full w-full rounded-3xl p-0 hover:bg-transparent focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open memory: ${card.title}`}
          onClick={() => setOpen(true)}
        />
        <div className="pointer-events-none relative flex flex-wrap items-start gap-1.5 text-[13px]">
          {question && (
            <span className="inline-flex h-11 items-start">
              <span className={pillClass}>
                <span className={`size-1.5 rounded-full ${question.dot}`} aria-hidden="true" />
                {question.text}
              </span>
            </span>
          )}
          {onCategoryChange ? (
            <Button
              variant="ghost"
              className="pointer-events-auto relative h-11 items-start rounded-full px-0 font-normal hover:bg-transparent"
              aria-label={`Filter by ${CATEGORY_LABEL[card.category] ?? card.category}`}
              onClick={() => onCategoryChange(card.category)}
            >
              <span className={pillClass}>
                {sentence(CATEGORY_LABEL[card.category] ?? card.category)}
              </span>
            </Button>
          ) : (
            <span className="inline-flex h-11 items-start">
              <span className={pillClass}>
                {sentence(CATEGORY_LABEL[card.category] ?? card.category)}
              </span>
            </span>
          )}
          <time dateTime={card.date} className="ml-auto whitespace-nowrap pt-0.5 text-[14px] text-ink-2">
            {shortDate(card.date)}
          </time>
        </div>
        <div className="pointer-events-none relative -mt-1 flex items-start gap-3">
          <h3 className="min-w-0 flex-1 break-words text-[21px] font-bold leading-snug text-ink">
            {card.title}
          </h3>
          <ArrowUpRight className="mt-1 size-4 shrink-0 text-ink-2" aria-hidden="true" />
        </div>
        {card.body && (
          <p className="pointer-events-none relative mt-1.5 line-clamp-3 whitespace-pre-wrap break-words text-[17px] leading-relaxed text-ink-2">
            {card.body}
          </p>
        )}
        {preview && <div className="pointer-events-none relative"><MomentPreview kind={preview} /></div>}
      </article>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="dossier-readable max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border-line bg-paper p-5 shadow-none sm:p-6">
          <DialogHeader className="pr-6 text-left">
            <DialogDescription className="text-ink-2">{formatDate(card.date)}</DialogDescription>
            <DialogTitle className="break-words text-[26px] font-bold leading-snug text-ink">
              {card.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {question && (
              <span className={pillClass}>
                <span className={`size-1.5 rounded-full ${question.dot}`} aria-hidden="true" />
                {question.text}
              </span>
            )}
            <span className={pillClass}>
              {sentence(CATEGORY_LABEL[card.category] ?? card.category)}
            </span>
          </div>
          {card.body && (
            <p className="whitespace-pre-wrap break-words text-[17px] leading-relaxed text-ink">
              {card.body}
            </p>
          )}
          {preview && <MomentPreview kind={preview} />}
          {entryLoading && (
            <p role="status" className="text-ink-2">
              Opening original note…
            </p>
          )}
          {entryError && (
            <p role="status" className="text-ink-2">
              The original note couldn’t be loaded.
            </p>
          )}
          {entry && (
            <section className="space-y-3 border-t border-line pt-4" aria-label="Original note">
              <h4 className="flex items-center gap-2 text-[15px] font-medium text-ink-2">
                {entry.source === "voice" ? (
                  <AudioLines className="size-4" aria-hidden="true" />
                ) : (
                  <AlignLeft className="size-4" aria-hidden="true" />
                )}
                {entry.source === "voice" ? "Original voice transcript" : "Original note"}
              </h4>
              <p className="whitespace-pre-wrap break-words text-[17px] leading-relaxed text-ink-2">
                {entry.raw_text}
              </p>
            </section>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
