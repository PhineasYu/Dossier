import { CATEGORY_LABEL, formatDate, type MemoryCard } from "@/lib/dossier";

export function MemoryCardView({ card, accent }: { card: MemoryCard; accent: string }) {
  const question = card.title.toLocaleLowerCase().includes("remember") || card.body?.toLocaleLowerCase().includes("remember") ? 2 : 1;
  const questionStyle = question === 1 ? "bg-orange-50 text-orange-ink" : "bg-green-50 text-green-ink";
  return (
    <article
      className="material-card p-5"
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="size-2 rounded-full" style={{ backgroundColor: question === 1 ? "var(--orange)" : "var(--green)" }} />
        <span className={`rounded-lg px-2 py-1 font-medium ${questionStyle}`}>
          Q{question} · {CATEGORY_LABEL[card.category] ?? card.category}
        </span>
        <span className="ml-auto size-2 rounded-full" style={{ backgroundColor: accent }} aria-label="Child theme" />
        <span>{formatDate(card.date)}</span>
      </div>
      <h3 className="mt-3 text-lg leading-snug">{card.title}</h3>
      {card.body && <p className="mt-1.5 text-sm text-muted-foreground">{card.body}</p>}
    </article>
  );
}
