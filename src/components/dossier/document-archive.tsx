import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarDays, FileText, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useChildren } from "@/lib/child-context";
import { extractDocument } from "@/lib/dossier.functions";
import type { DocumentRow } from "@/lib/dossier";

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export function DocumentArchive({ autoOpen = false }: { autoOpen?: boolean }) {
  const { active } = useChildren();
  const queryClient = useQueryClient();
  const runExtract = useServerFn(extractDocument);
  const inputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const didAutoOpen = useRef(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      const signed: Record<string, string> = {};
      await Promise.all(
        rows.map(async (row) => {
          const { data: url } = await supabase.storage
            .from("documents")
            .createSignedUrl(row.file_url, 3600);
          if (url?.signedUrl) signed[row.id] = url.signedUrl;
        }),
      );
      setPreviews((current) => ({ ...current, ...signed }));
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

  const selected = docs.find((doc) => doc.id === selectedId) ?? docs[0];
  const selectedUrl = selected ? previews[selected.id] : undefined;
  const selectedIsImage = selected ? !selected.file_url.toLowerCase().endsWith(".pdf") : false;
  const selectedFields = (selected?.extracted_json ?? {}) as Record<string, unknown>;

  return (
    <section className="overflow-hidden rounded-lg border bg-folder-paper shadow-sm">
      <div className="flex items-center justify-between border-b px-5 py-4">
      <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg">Document archive</h2>
            <p className="mt-0.5 text-xs uppercase text-muted-foreground">
              {docs.length} {docs.length === 1 ? "file" : "files"} · privately kept
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          size="sm"
          className="rounded-full bg-child text-primary-foreground hover:bg-child/90"
        >
          {upload.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          Upload
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

      <div className="px-4 pb-5 pt-7">
        {!docs.length ? (
          <div className="relative mx-auto max-w-md pt-8">
            <div className="absolute left-5 top-0 h-12 w-44 rounded-t-lg border bg-folder-blue px-4 pt-2 text-xs font-medium uppercase">
              School & health
            </div>
            <div className="relative min-h-52 rounded-lg border bg-folder-blue p-6 shadow-sm">
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <FileText className="mb-3 size-8 text-muted-foreground" strokeWidth={1.3} />
                <p className="font-display text-lg">An empty folder, ready</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Add a check-up sheet or school report. The original stays beside the details Dossier reads.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            <div className="relative h-28" aria-label="Document folders">
              {docs.slice(0, 5).map((doc, index) => {
                const isSelected = doc.id === selected?.id;
                const tones = ["bg-folder-blue", "bg-folder-sage", "bg-folder-stone"];
                return (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedId(doc.id)}
                    className={`absolute h-20 w-full rounded-t-lg border px-4 pt-2 text-left transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tones[index % tones.length]} ${isSelected ? "-translate-y-2" : "hover:-translate-y-1"}`}
                    style={{ top: `${index * 15}px`, zIndex: index + 1 }}
                    aria-pressed={isSelected}
                  >
                    <span className="block max-w-[70%] truncate text-xs font-semibold uppercase">
                      {doc.doc_type ?? "Untitled document"}
                    </span>
                  </button>
                );
              })}
            </div>

            {selected && (
              <article className="relative z-10 grid gap-4 rounded-lg border bg-card p-4 shadow-md sm:grid-cols-[1.1fr_1fr]">
                <a
                  href={selectedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-48 overflow-hidden rounded-md border bg-muted"
                >
                  {selectedUrl && selectedIsImage ? (
                    <img
                      src={selectedUrl}
                      alt={selected.doc_type ?? "Document"}
                      className="h-52 w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <span className="m-auto flex flex-col items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="size-9" strokeWidth={1.3} />
                      Open original
                    </span>
                  )}
                </a>
                <div className="min-w-0">
                  <p className="font-display text-lg">{selected.doc_type ?? "Document"}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    {new Date(selected.uploaded_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  {Object.keys(selectedFields).length ? (
                    <dl className="mt-4 divide-y text-sm">
                      {Object.entries(selectedFields).map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-3 py-2">
                          <dt className="capitalize text-muted-foreground">{key.replaceAll("_", " ")}</dt>
                          <dd className="text-right font-medium">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">No details were found in this file.</p>
                  )}
                </div>
              </article>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
