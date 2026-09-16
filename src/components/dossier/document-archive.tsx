import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion } from "motion/react";
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
    <section className="material-card overflow-hidden bg-folder-paper">
      <div className="flex items-center justify-between border-b border-outline-variant px-5 py-4">
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
          className="bg-child text-primary-foreground"
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

      <div className="px-4 pb-5 pt-8">
        {!docs.length ? (
          <div className="relative mx-auto max-w-md pt-9">
            <div className="absolute left-0 top-0 h-14 w-48 rounded-t-2xl bg-folder-blue px-5 pt-3 text-xs font-semibold uppercase tracking-wider text-on-primary-container">
              School & health
            </div>
            <div className="relative min-h-52 rounded-b-2xl rounded-tr-2xl bg-folder-blue p-6 shadow-[var(--elevation-2)]">
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
            <div className="relative h-44" aria-label="Document folders">
              {docs.slice(0, 5).map((doc, index) => {
                const isSelected = doc.id === selected?.id;
                const tones = ["bg-folder-blue", "bg-primary", "bg-folder-blue", "bg-primary", "bg-folder-blue"];
                const alignRight = index % 2 === 1;
                return (
                  <motion.button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedId(doc.id)}
                    animate={{ y: isSelected ? -8 : 0 }}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
                    className={`absolute h-24 w-full rounded-t-2xl px-5 pt-3 text-left text-primary-foreground shadow-[var(--elevation-1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${tones[index % tones.length]}`}
                    style={{ top: `${index * 28}px`, zIndex: index + 1, clipPath: alignRight ? "polygon(0 30%, 55% 30%, 62% 0, 100% 0, 100% 100%, 0 100%)" : "polygon(0 0, 40% 0, 47% 30%, 100% 30%, 100% 100%, 0 100%)" }}
                    aria-pressed={isSelected}
                  >
                    <span className={`block max-w-[42%] truncate text-xs font-semibold uppercase tracking-wider ${alignRight ? "ml-auto text-right" : ""}`}>
                      {doc.doc_type ?? "Untitled document"}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <AnimatePresence mode="wait">
            {selected && (
              <motion.article
                key={selected.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
                className="relative z-10 grid gap-4 rounded-b-2xl rounded-t-lg bg-surface-container-low p-4 shadow-[var(--elevation-3)] sm:grid-cols-[1.1fr_1fr]"
              >
                <a
                  href={selectedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex min-h-48 overflow-hidden rounded-xl border border-outline-variant bg-surface-container"
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
              </motion.article>
            )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </section>
  );
}
