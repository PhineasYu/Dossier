import { CATEGORY_LABEL, shortDate, type MemoryCard } from "@/lib/dossier";
import { CATEGORY_TINT } from "@/lib/palette";
import { Button } from "@/components/ui/button";

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
}: {
  card: MemoryCard;
  onCategoryChange?: ((category: string | null) => void) | undefined;
}) {
  const question = card.question_origin ? QUESTION_LABEL[card.question_origin] : null;
  return (
    <article className={`rounded-3xl p-5 sm:p-6 ${CATEGORY_TINT[card.category] ?? "bg-cloud"}`}>
      <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
        {question && (
          <span className="flex items-center gap-1.5 rounded-full bg-paper px-2.5 py-0.5 font-medium text-ink-2">
            <span className={`size-2 rounded-full ${question.dot}`} aria-hidden="true" />
            {question.text}
          </span>
        )}
        {onCategoryChange ? (
          <Button
            variant="ghost"
            className="h-11 bg-paper px-3 text-[13px] font-medium"
            aria-label={`Filter by ${CATEGORY_LABEL[card.category] ?? card.category}`}
            onClick={() => onCategoryChange(card.category)}
          >
            {sentence(CATEGORY_LABEL[card.category] ?? card.category)}
          </Button>
        ) : (
          <span className="rounded-full bg-paper px-2.5 py-0.5 font-medium text-ink-2">
            {sentence(CATEGORY_LABEL[card.category] ?? card.category)}
          </span>
        )}
        <time dateTime={card.date} className="ml-auto whitespace-nowrap text-xs text-ink-2">
          {shortDate(card.date)}
        </time>
      </div>
      <h3 className="mt-3 break-words text-[19px] font-bold leading-snug text-ink">{card.title}</h3>
      {card.body && <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{card.body}</p>}
    </article>
  );
}
