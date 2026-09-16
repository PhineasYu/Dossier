import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
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

export function DocumentArchive() {
  const { active } = useChildren();
  const queryClient = useQueryClient();
  const runExtract = useServerFn(extractDocument);
  const inputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  const { data: docs = [] } = useQuery({
    queryKey: ["documents", active?.id],
    enabled: Boolean(active?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, child_id, file_url, doc_type, extracted_json, uploaded_at")
        .eq("child_id", active!.id)
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

  return (
    <div className="paper rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg">Document archive</h3>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={upload.isPending}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: "var(--child)" }}
        >
          {upload.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Upload className="size-3.5" />
          )}
          Upload
        </button>
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

      {!docs.length && (
        <p className="mt-3 text-sm text-muted-foreground">
          Add a check-up sheet or school report — the original stays, the numbers get pulled out.
        </p>
      )}

      <div className="mt-4 space-y-4">
        {docs.map((doc) => {
          const url = previews[doc.id];
          const isImage = !doc.file_url.toLowerCase().endsWith(".pdf");
          const fields = (doc.extracted_json ?? {}) as Record<string, unknown>;
          return (
            <div key={doc.id} className="grid gap-3 rounded-xl border p-3 sm:grid-cols-2">
              <div className="overflow-hidden rounded-lg bg-muted">
                {url && isImage ? (
                  <img src={url} alt={doc.doc_type ?? "Document"} className="h-44 w-full object-cover" />
                ) : (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-44 flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
                  >
                    <FileText className="size-8" strokeWidth={1.4} />
                    Open original
                  </a>
                )}
              </div>
              <div>
                <p className="font-display text-base">{doc.doc_type ?? "Document"}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {Object.entries(fields).map(([key, value]) => (
                    <li key={key} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="text-right">{String(value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
