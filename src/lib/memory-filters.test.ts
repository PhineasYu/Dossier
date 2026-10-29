import { describe, test } from "node:test";
import { deepStrictEqual } from "node:assert";
import type { MemoryCard } from "./dossier";
import { filterMemories } from "./memory-filters";

const cards: MemoryCard[] = [
  {
    id: "courage-old",
    child_id: "luca",
    entry_id: null,
    date: "2025-04-10",
    title: "First swim",
    body: null,
    category: "courage",
  },
  {
    id: "courage-new",
    child_id: "luca",
    entry_id: null,
    date: "2026-04-10",
    title: "School play",
    body: null,
    category: "courage",
  },
  {
    id: "dream",
    child_id: "luca",
    entry_id: null,
    date: "2026-04-10",
    title: "Dream of swimming",
    body: null,
    category: "dream",
  },
];

describe("memory filters", () => {
  test("a category label actually narrows the memories", () => {
    deepStrictEqual(filterMemories(cards, { category: "courage" }).map((card) => card.id), [
      "courage-old",
      "courage-new",
    ]);
  });
  test("All clears the category selection", () => {
    deepStrictEqual(filterMemories(cards, { category: null }).map((card) => card.id), [
      "courage-old",
      "courage-new",
      "dream",
    ]);
  });
  test("category filtering respects the selected age", () => {
    deepStrictEqual(
      filterMemories(cards, { category: "courage", age: 5, birthdate: "2020-01-01" }).map(
        (card) => card.id,
      ),
      ["courage-old"],
    );
  });
  test("category filtering intersects keyword search", () => {
    deepStrictEqual(
      filterMemories(cards, { category: "courage", query: "swim" }).map((card) => card.id),
      ["courage-old"],
    );
  });
  test("category filtering intersects smart search results", () => {
    deepStrictEqual(
      filterMemories(cards, { category: "courage", smartCardIds: ["dream", "courage-new"] }).map(
        (card) => card.id,
      ),
      ["courage-new"],
    );
  });
});
