import { CATEGORY_LABEL, formatDate, type MemoryCard } from "@/lib/dossier";

export function MemoryCardView({ card, accent }: { card: MemoryCard; accent: string }) {
  return (
    <article
      className="material-card p-5 transition-shadow hover:shadow-[var(--elevation-2)]"
      style={{ borderLeft: `3px solid ${accent}` }}
    >
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className="rounded-full px-3 py-1 font-medium"
          style={{ backgroundColor: "var(--child-soft)", color: accent }}
        >
          {CATEGORY_LABEL[card.category] ?? card.category}
        </span>
        <span>{formatDate(card.date)}</span>
      </div>
      <h3 className="mt-3 text-lg leading-snug">{card.title}</h3>
      {card.body && <p className="mt-1.5 text-sm text-muted-foreground">{card.body}</p>}
    </article>
  );
}
