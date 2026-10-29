import { describe, test } from "node:test";
import { strictEqual } from "node:assert";
import { filterDocuments, sampleDocuments } from "./document-library";

describe("document library", () => {
  test("simulation contains 42 files across seven years", () => {
    const docs = sampleDocuments();
    strictEqual(docs.length, 42);
    strictEqual(new Set(docs.map((doc) => doc.uploaded_at.slice(0, 4))).size, 7);
  });
  test("year and type filters intersect", () => {
    const docs = filterDocuments(sampleDocuments(), "", "2024", "School");
    strictEqual(docs.length, 2);
    strictEqual(docs.every((doc) => doc.uploaded_at.startsWith("2024")), true);
  });
  test("search locates a specific report across the whole library", () => {
    const docs = filterDocuments(sampleDocuments(), "vaccination", "all", "Health");
    strictEqual(docs.length, 7);
  });
});
