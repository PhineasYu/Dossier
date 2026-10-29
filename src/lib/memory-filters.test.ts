import { describe, test } from "node:test";
import { deepStrictEqual } from "node:assert";
import type { MemoryCard } from "./dossier";
import { filterMemories } from "./memory-filters";
const cards: MemoryCard[] = [
  {
    id: "old",
    child_id: "luca",
    entry_id: null,
    date: "2025-04-10",
    title: "First swim",
    body: null,
    category: "courage",
  },
  {
    id: "new",
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
const ids = (filters: Parameters<typeof filterMemories>[1]) =>
  filterMemories(cards, filters).map((c) => c.id);
describe("memory filters", () => {
  test("category labels filter memories", () =>
    deepStrictEqual(ids({ category: "courage" }), ["old", "new"]));
  test("All clears category", () =>
    deepStrictEqual(ids({ category: null }), ["old", "new", "dream"]));
  test("category intersects age", () =>
    deepStrictEqual(ids({ category: "courage", age: 5, birthdate: "2020-01-01" }), ["old"]));
  test("category intersects keyword", () =>
    deepStrictEqual(ids({ category: "courage", query: "swim" }), ["old"]));
  test("category intersects AI matches", () =>
    deepStrictEqual(ids({ category: "courage", smartCardIds: ["dream", "new"] }), ["new"]));
});
