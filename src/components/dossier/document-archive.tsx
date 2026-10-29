import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, FileText, Loader2, Upload, Search, Library } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChildren } from "@/lib/child-context";
import { extractDocument } from "@/lib/dossier.functions";
import type { DocumentRow } from "@/lib/dossier";
import { documentKind, filterDocuments, sampleDocuments } from "@/lib/document-library";
import { Input } from "@/components/ui/input";

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function DocumentArchive({
  autoOpen = false,
  query = "",
}: {
  autoOpen?: boolean;
  query?: string;
}) {
  const { active } = useChildren();
  const queryClient = useQueryClient();
  const runExtract = useServerFn(extractDocument);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const didAutoOpen = useRef(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [simulation, setSimulation] = useState(false);
  const [libraryQuery, setLibraryQuery] = useState("");
  const [year, setYear] = useState("all");
  const [kind, setKind] = useState("all");

  useEffect(() => {
    if (!autoOpen || didAutoOpen.current) return;
    didAutoOpen.current = true;
    photoInputRef.current?.click();
  }, [autoOpen]);

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", active?.id],
    enabled: Boolean(active?.id),
    queryFn: async () => {
      if (!active) return [];
      const { data, error } = await supabase
        .from("documents")
        .select("id, child_id, file_url, doc_type, extracted_json, uploaded_at")
        .eq("child_id", active.id)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      const rows = data as DocumentRow[];
      return rows;
    },
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      if (!active) throw new Error("Pick a child first.");
      const path = `${active.id}/${Date.now()}-${file.name.replace(/[^\w.-]/g, "_")}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: row, error } = await supabase
        .from("documents")
        .insert({ child_id: active.id, file_url: path, doc_type: "Reading…" })
        .select("id")
        .single();
      if (error) throw error;

      const dataUrl = await readAsDataUrl(file);
      await runExtract({
        data: { documentId: row.id, dataUrl, mimeType: file.type },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast("Document filed and read.");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Upload failed."),
  });

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleDocs = normalizedQuery
    ? docs.filter((doc) =>
        [doc.doc_type ?? "", doc.uploaded_at, JSON.stringify(doc.extracted_json ?? {})]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
    : docs;
  const libraryDocs = simulation ? sampleDocuments() : docs;
  const libraryResults = filterDocuments(libraryDocs, libraryQuery, year, kind);
  const years = [...new Set(libraryDocs.map((doc) => doc.uploaded_at.slice(0, 4)))]
    .sort()
    .reverse();
  const selected = [...docs, ...sampleDocuments()].find((doc) => doc.id === selectedId);
  const selectedUrl = selected ? previews[selected.id] : undefined;
  const selectedIsImage = selected ? !selected.file_url.toLowerCase().endsWith(".pdf") : false;
  const selectedFields = (selected?.extracted_json ?? {}) as Record<string, unknown>;

  useEffect(() => {
    if (!selected?.file_url) return;
    let cancelled = false;
    void supabase.storage
      .from("documents")
      .createSignedUrl(selected.file_url, 3600)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl)
          setPreviews((current) => ({ ...current, [selected.id]: data.signedUrl }));
      });
    return () => {
      cancelled = true;
    };
  }, [selected?.id, selected?.file_url]);

  useEffect(() => {
    setSelectedId(null);
    setSimulation(false);
    setLibraryQuery("");
    setYear("all");
    setKind("all");
  }, [active?.id]);

  function fileRows(rows: DocumentRow[]) {
    return (
      <ul className="divide-y divide-line" aria-label="Saved documents">
        {rows.map((doc) => (
          <li key={doc.id}>
            <Button
              variant="ghost"
              onClick={() => setSelectedId(doc.id)}
              className="h-auto min-h-20 w-full justify-start gap-3 whitespace-normal rounded-xl px-0 py-3 text-left hover:bg-transparent hover:text-action-ink focus-visible:ring-1 focus-visible:ring-action-ink"
              aria-label={`View ${doc.doc_type ?? "document"}`}
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-paper">
                <FileText className="size-5 text-ink-2" strokeWidth={1.25} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block break-words text-[17px] font-semibold text-ink">
                  {doc.doc_type ?? "Untitled document"}
                </span>
                <span className="mt-1 block text-[14px] font-normal text-ink-2">
                  {documentKind(doc)} ·{" "}
                  {new Date(doc.uploaded_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </span>
              <ArrowUpRight className="size-4 shrink-0 text-ink-2" aria-hidden="true" />
            </Button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="rounded-3xl bg-cloud p-5 sm:p-6" aria-label="Documents">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold">Documents</h2>
          <p className="mt-1 text-[15px] text-ink-2">
            {visibleDocs.length} {visibleDocs.length === 1 ? "file" : "files"}
          </p>
        </div>
        <Button type="button" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? <Loader2 className="animate-spin" /> : <Upload />} Add
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload.mutate(file);
          event.target.value = "";
        }}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) upload.mutate(file);
          event.target.value = "";
        }}
      />

      {!visibleDocs.length ? (
        <div className="py-8 text-center text-[17px] text-ink-2">
          <FileText className="mx-auto mb-3 size-8" strokeWidth={1.25} />
          {normalizedQuery ? "No documents match" : "Nothing filed yet"}
        </div>
      ) : (
        <div className="mt-3">{fileRows(visibleDocs.slice(0, 3))}</div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
        <Button
          variant="ghost"
          onClick={() => {
            setSimulation(false);
            setLibraryQuery(query);
            setYear("all");
            setKind("all");
            setLibraryOpen(true);
          }}
          className="px-0"
        >
          <Library className="size-4" /> Browse all {docs.length} files <ArrowUpRight />
        </Button>
        <Button
          variant="ghost"
          className="px-0 text-[14px] font-normal text-ink-2"
          onClick={() => {
            setSimulation(true);
            setLibraryQuery("");
            setYear("all");
            setKind("all");
            setLibraryOpen(true);
          }}
        >
          Preview 42 sample files
        </Button>
      </div>
      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="dossier-readable flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl flex-col gap-4 overflow-hidden rounded-3xl border-0 bg-paper p-5 shadow-none sm:p-6">
          <DialogHeader className="pr-6 text-left">
            <DialogTitle className="text-[24px]">
              {simulation ? "Sample document library" : "Documents"}
            </DialogTitle>
            <DialogDescription>
              {simulation
                ? "42 illustrative files · not your child’s records"
                : `${docs.length} saved files`}
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-ink-2" />
            <Input
              aria-label="Search documents"
              placeholder="Search reports, dates, notes…"
              value={libraryQuery}
              onChange={(event) => setLibraryQuery(event.target.value)}
              className="h-11 rounded-xl border-line pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-[14px] text-ink-2">
              Year
              <select
                aria-label="Document year"
                className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-ink"
                value={year}
                onChange={(event) => setYear(event.target.value)}
              >
                <option value="all">All years</option>
                {years.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-[14px] text-ink-2">
              Type
              <select
                aria-label="Document type"
                className="h-11 w-full rounded-xl border border-line bg-paper px-3 text-ink"
                value={kind}
                onChange={(event) => setKind(event.target.value)}
              >
                <option value="all">All types</option>
                {["Health", "School", "Other"].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <p role="status" className="text-[14px] text-ink-2">
            {libraryResults.length} files
          </p>
          <div className="min-h-0 overflow-y-auto pr-1">
            {libraryResults.length ? (
              years
                .filter((value) => libraryResults.some((doc) => doc.uploaded_at.startsWith(value)))
                .map((value) => (
                  <section key={value} aria-label={`Documents from ${value}`} className="mb-4">
                    <h3 className="sticky top-0 bg-paper py-2 text-[18px] font-bold">{value}</h3>
                    {fileRows(libraryResults.filter((doc) => doc.uploaded_at.startsWith(value)))}
                  </section>
                ))
            ) : (
              <p className="py-6 text-center text-ink-2">No documents match these filters.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <DialogContent className="dossier-readable max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-0 shadow-none sm:rounded-3xl">
          <DialogHeader className="pr-6 text-left">
            <DialogTitle className="break-words text-[22px] font-bold">
              {selected?.doc_type ?? "Document"}
            </DialogTitle>
            <DialogDescription className="text-[15px]">
              {selected &&
                new Date(selected.uploaded_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
            </DialogDescription>
          </DialogHeader>
          {selectedUrl && selectedIsImage && (
            <img
              src={selectedUrl}
              alt={selected?.doc_type ?? "Document"}
              className="max-h-80 w-full rounded-lg object-contain"
            />
          )}
          <dl className="divide-y divide-line text-[17px]">
            {Object.entries(selectedFields).map(([key, value]) => (
              <div key={key} className="space-y-1 py-3">
                <dt className="text-[15px] capitalize text-ink-2">{key.replaceAll("_", " ")}</dt>
                <dd className="break-words font-medium text-ink">
                  {typeof value === "object" ? JSON.stringify(value) : String(value)}
                </dd>
              </div>
            ))}
          </dl>
          {selectedUrl && (
            <Button asChild>
              <a href={selectedUrl} target="_blank" rel="noreferrer">
                Open original <ArrowUpRight />
              </a>
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
