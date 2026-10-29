import { ageAt, type MemoryCard } from "./dossier";
export type MemoryFilters = {
  category?: string | null | undefined;
  age?: number | null | undefined;
  birthdate?: string | null | undefined;
  query?: string | undefined;
  smartCardIds?: string[] | undefined;
};
/** Category, age and search always intersect, including AI-selected results. */
export function filterMemories(cards: MemoryCard[], filters: MemoryFilters) {
  const query = (filters.query ?? "").trim().toLocaleLowerCase();
  return cards.filter((card) => {
    if (filters.category && card.category !== filters.category) return false;
    if (filters.age != null && ageAt(filters.birthdate ?? null, card.date) !== filters.age)
      return false;
    if (filters.smartCardIds) return filters.smartCardIds.includes(card.id);
    return (
      !query ||
      [card.title, card.body ?? "", card.category, card.date]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query)
    );
  });
}
