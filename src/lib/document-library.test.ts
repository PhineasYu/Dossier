import { describe, expect, test } from "bun:test";
import { filterDocuments, sampleDocuments } from "./document-library";

describe("document library", () => {
  test("simulation contains 42 files across seven years", () => {
    const docs = sampleDocuments();
    expect(docs.length).toBe(42);
    expect(new Set(docs.map((doc) => doc.uploaded_at.slice(0, 4))).size).toBe(7);
  });
  test("year and type filters intersect", () => {
    const docs = filterDocuments(sampleDocuments(), "", "2024", "School");
    expect(docs.length).toBe(2);
    expect(docs.every((doc) => doc.uploaded_at.startsWith("2024"))).toBe(true);
  });
  test("search locates a specific report across the whole library", () => {
    const docs = filterDocuments(sampleDocuments(), "vaccination", "all", "Health");
    expect(docs.length).toBe(7);
  });
});