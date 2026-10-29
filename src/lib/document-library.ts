import type { DocumentRow } from "./dossier";

export function documentKind(doc: DocumentRow) {
  const text = (doc.doc_type ?? "").toLowerCase();
  if (/school|teacher|nursery|preschool/.test(text)) return "School";
  if (/check|health|medical|vaccin|birth|dental|vision/.test(text)) return "Health";
  return "Other";
}

export function filterDocuments(docs: DocumentRow[], query: string, year: string, kind: string) {
  const keyword = query.trim().toLowerCase();
  return docs
    .filter(
      (doc) =>
        (year === "all" || doc.uploaded_at.slice(0, 4) === year) &&
        (kind === "all" || documentKind(doc) === kind) &&
        (!keyword ||
          [doc.doc_type, doc.uploaded_at, JSON.stringify(doc.extracted_json)]
            .join(" ")
            .toLowerCase()
            .includes(keyword)),
    )
    .sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
}

/** Explicit UI simulation only: never persisted or mixed with real records. */
export function sampleDocuments(): DocumentRow[] {
  const titles = [
    "Annual health check",
    "Vaccination record",
    "Dental check",
    "Vision screening",
    "School report",
    "Teacher meeting",
  ];
  return Array.from({ length: 42 }, (_, i) => {
    const year = 2026 - Math.floor(i / 6);
    const title = titles[i % 6] ?? "Document";
    return {
      id: `sample-document-${i}`,
      child_id: null,
      file_url: "",
      doc_type: `${title} · ${year}`,
      uploaded_at: `${year}-${String(12 - (i % 6) * 2).padStart(2, "0")}-01T12:00:00Z`,
      extracted_json: { sample: "Illustrative file — no real report attached", year, type: title },
    };
  });
}
