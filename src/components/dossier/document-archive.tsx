import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, FileText, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibleDocs = normalizedQuery
    ? docs.filter((doc) =>
        [doc.doc_type ?? "", doc.uploaded_at, JSON.stringify(doc.extracted_json ?? {})]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedQuery),
      )
    : docs;
  const selected = visibleDocs.find((doc) => doc.id === selectedId);
  const selectedUrl = selected ? previews[selected.id] : undefined;
  const selectedIsImage = selected ? !selected.file_url.toLowerCase().endsWith(".pdf") : false;
  const selectedFields = (selected?.extracted_json ?? {}) as Record<string, unknown>;

  return (
    <section className="rounded-3xl bg-cloud p-5 sm:p-6" aria-label="Documents">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[20px] font-bold">Documents</h2>
          <p className="mt-1 text-[15px] text-ink-2">{visibleDocs.length} {visibleDocs.length === 1 ? "file" : "files"}</p>
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
        <ul className="mt-4 divide-y divide-paper" aria-label="Saved documents">
          {visibleDocs.map(doc => {
            const image = !doc.file_url.toLowerCase().endsWith(".pdf");
            return <li key={doc.id}>
              <Button variant="ghost" onClick={()=>setSelectedId(doc.id)} className="h-auto min-h-24 w-full justify-start gap-4 whitespace-normal rounded-none px-0 py-4 text-left hover:bg-paper/50" aria-label={`View ${doc.doc_type ?? "document"}`}>
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-paper">
                  {image && previews[doc.id] ? <img src={previews[doc.id]} alt="" className="size-full object-cover" /> : <FileText className="size-6 text-ink-2" strokeWidth={1.25} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-[17px] font-semibold text-ink">{doc.doc_type ?? "Untitled document"}</span>
                  <span className="mt-1 block text-[15px] font-normal text-ink-2">{new Date(doc.uploaded_at).toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"})}</span>
                </span>
                <ArrowUpRight className="text-ink-2" aria-hidden="true" />
              </Button>
            </li>;
          })}
        </ul>
      )}
      <Dialog open={Boolean(selected)} onOpenChange={open=>{if (!open) setSelectedId(null);}}>
        <DialogContent className="dossier-readable max-h-[85dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-3xl border-0 shadow-none sm:rounded-3xl">
          <DialogHeader className="pr-6 text-left">
            <DialogTitle className="break-words text-[22px] font-bold">{selected?.doc_type ?? "Document"}</DialogTitle>
            <DialogDescription className="text-[15px]">{selected && new Date(selected.uploaded_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</DialogDescription>
          </DialogHeader>
          {selectedUrl && selectedIsImage && <img src={selectedUrl} alt={selected?.doc_type ?? "Document"} className="max-h-80 w-full rounded-lg object-contain" />}
          <dl className="divide-y divide-line text-[17px]">
            {Object.entries(selectedFields).map(([key,value])=><div key={key} className="space-y-1 py-3">
              <dt className="text-[15px] capitalize text-ink-2">{key.replaceAll("_"," ")}</dt>
              <dd className="break-words font-medium text-ink">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
            </div>)}
          </dl>
          {selectedUrl && <Button asChild><a href={selectedUrl} target="_blank" rel="noreferrer">Open original <ArrowUpRight /></a></Button>}
        </DialogContent>
      </Dialog>
    </section>
  );
}
