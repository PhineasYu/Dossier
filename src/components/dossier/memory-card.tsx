import { CATEGORY_LABEL, shortDate, type MemoryCard } from "@/lib/dossier";
import { CATEGORY_TINT } from "@/lib/palette";
import { Button } from "@/components/ui/button";

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
}: {
  card: MemoryCard;
  onCategoryChange?: ((category: string | null) => void) | undefined;
}) {
  const question = card.question_origin ? QUESTION_LABEL[card.question_origin] : null;
  return (
    <article className={`rounded-3xl p-5 sm:p-6 ${CATEGORY_TINT[card.category] ?? "bg-cloud"}`}>
      <div className="flex flex-wrap items-center gap-1.5 text-[13px]">
        {question && (
          <span className="inline-flex h-11 items-center">
            <span className={pillClass}>
              <span className={`size-1.5 rounded-full ${question.dot}`} aria-hidden="true" />
              {question.text}
            </span>
          </span>
        )}
        {onCategoryChange ? (
          <Button
            variant="ghost"
            className="h-11 rounded-full px-0 font-normal hover:bg-transparent"
            aria-label={`Filter by ${CATEGORY_LABEL[card.category] ?? card.category}`}
            onClick={() => onCategoryChange(card.category)}
          >
            <span className={pillClass}>{sentence(CATEGORY_LABEL[card.category] ?? card.category)}</span>
          </Button>
        ) : (
          <span className="inline-flex h-11 items-center">
            <span className={pillClass}>{sentence(CATEGORY_LABEL[card.category] ?? card.category)}</span>
          </span>
        )}
        <time dateTime={card.date} className="ml-auto whitespace-nowrap text-[14px] text-ink-2">
          {shortDate(card.date)}
        </time>
      </div>
      <h3 className="mt-3 break-words text-[21px] font-bold leading-snug text-ink">{card.title}</h3>
      {card.body && <p className="mt-1.5 text-[17px] leading-relaxed text-ink-2">{card.body}</p>}
    </article>
  );
}
