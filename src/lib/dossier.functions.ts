import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

type ExtractedItem = {
  child_ids: string[];
  kind: "card" | "profile_fact";
  category?: string;
  field?: string;
  title?: string;
  text?: string;
  value?: string;
};

function stripFences(raw: string) {
  return raw
    .replace(/^\s*```(?:json)?/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

async function callGateway(messages: unknown[]) {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured for this project.");
  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, messages }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI request failed [${res.status}]: ${body}`);
  }
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return json.choices?.[0]?.message?.content ?? "";
}

async function parseItems(transcript: string, children: { id: string; name: string }[]) {
  const system = `You sort a parent's spoken notes about their children into atomic items.
Children: ${children.map((c) => `${c.name} = ${c.id}`).join("; ")}

Return JSON ONLY, no prose, in this exact shape:
{"items":[{"child_ids":["<child uuid>"],"kind":"card"|"profile_fact","category":"courage|dream|fear|friendship|first-time|interest|other","field":"allergy|height|weight|food_like|food_dislike|interest|friend|medical","title":"short memory title","text":"one or two warm sentences","value":"the fact value"}]}

Rules:
- Split into the smallest meaningful items. One idea per item.
- kind "card" is an emotional memory: use category, title and text; omit field and value.
- kind "profile_fact" is structured data: use field and value; omit category, title and text. For height use centimetres as a bare number, for weight kilograms as a bare number.
- A sentence about two children becomes one item per child (each with a single child_id).
- Use only the child ids listed above. If a child is unclear, use the first child.
- Never invent facts that were not said.`;

  const attempt = async () => {
    const raw = await callGateway([
      { role: "system", content: system },
      { role: "user", content: transcript },
    ]);
    return JSON.parse(stripFences(raw)) as { items: ExtractedItem[] };
  };

  try {
    return await attempt();
  } catch {
    return await attempt();
  }
}

/** Split a transcript, store everything, and return what was created. */
export const captureEntry = createServerFn({ method: "POST" })
  .inputValidator((input: { transcript: string; source: "voice" | "text"; questionOrigin?: "for_child" | "child_moment" }) => {
    if (!input?.transcript?.trim()) throw new Error("Nothing to save yet.");
    return { transcript: input.transcript.trim(), source: input.source, questionOrigin: input.questionOrigin };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: children, error: childErr } = await supabaseAdmin
      .from("children")
      .select("id, name")
      .order("created_at");
    if (childErr) throw new Error(childErr.message);
    if (!children?.length) throw new Error("No children in the archive yet.");

    const parsed = await parseItems(data.transcript, children);
    const items = (parsed.items ?? []).filter((item) => item?.kind);

    const { data: entry, error: entryErr } = await supabaseAdmin
      .from("entries")
      .insert({ raw_text: data.transcript, source: data.source })
      .select("id")
      .single();
    if (entryErr) throw new Error(entryErr.message);

    const known = new Set(children.map((c) => c.id));
    const today = new Date().toISOString().slice(0, 10);
    const cardRows: {
      child_id: string;
      entry_id: string;
      date: string;
      title: string;
      body: string | null;
      category: string;
      question_origin: "for_child" | "child_moment" | null;
    }[] = [];
    const factRows: {
      child_id: string;
      entry_id: string;
      date: string;
      field: string;
      value: string;
    }[] = [];

    for (const item of items) {
      const ids = (item.child_ids ?? []).filter((id) => known.has(id));
      const targets = ids.length ? ids : [children[0]!.id];
      for (const childId of targets) {
        if (item.kind === "card") {
          cardRows.push({
            child_id: childId,
            entry_id: entry.id,
            date: today,
            title: item.title || (item.text ?? "A moment").slice(0, 60),
            body: item.text ?? null,
            category: item.category || "other",
            question_origin: data.questionOrigin ?? null,
          });
        } else if (item.field && item.value) {
          factRows.push({
            child_id: childId,
            entry_id: entry.id,
            date: today,
            field: item.field,
            value: item.value,
          });
        }
      }
    }

    const createdCards = cardRows.length
      ? ((await supabaseAdmin.from("cards").insert(cardRows).select("*")).data ?? [])
      : [];
    const createdFacts = factRows.length
      ? ((await supabaseAdmin.from("profile_facts").insert(factRows).select("*")).data ?? [])
      : [];

    const childrenTouched = new Set(
      [...createdCards, ...createdFacts].map((row) => (row as { child_id: string }).child_id),
    );

    return {
      entryId: entry.id as string,
      cards: createdCards,
      facts: createdFacts,
      summary: {
        memories: createdCards.length,
        updates: createdFacts.length,
        children: childrenTouched.size,
      },
    };
  });

/** Undo the last capture: remove everything created by one entry. */
export const undoEntry = createServerFn({ method: "POST" })
  .inputValidator((input: { entryId: string }) => {
    if (!input?.entryId) throw new Error("Missing entry.");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("cards").delete().eq("entry_id", data.entryId);
    await supabaseAdmin.from("profile_facts").delete().eq("entry_id", data.entryId);
    await supabaseAdmin.from("entries").delete().eq("id", data.entryId);
    return { ok: true };
  });

/** Answer a question from either the child's timeline or structured archive. */
export const askArchive = createServerFn({ method: "POST" })
  .inputValidator((input: { question: string; childId: string; scope?: "timeline" | "archive" }) => {
    if (!input?.question?.trim()) throw new Error("Ask something first.");
    return {
      question: input.question.trim(),
      childId: input.childId,
      scope: input.scope === "archive" ? ("archive" as const) : ("timeline" as const),
    };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: child }, { data: cards }, { data: facts }, { data: documents }] = await Promise.all([
      supabaseAdmin.from("children").select("name, birthdate").eq("id", data.childId).single(),
      supabaseAdmin
        .from("cards")
        .select("id, date, title, body, category")
        .eq("child_id", data.childId)
        .order("date", { ascending: false }),
      supabaseAdmin
        .from("profile_facts")
        .select("id, field, value, date")
        .eq("child_id", data.childId)
        .order("date", { ascending: false }),
      supabaseAdmin
        .from("documents")
        .select("id, doc_type, extracted_json, uploaded_at")
        .eq("child_id", data.childId)
        .order("uploaded_at", { ascending: false }),
    ]);

    const catalogue = (cards ?? [])
      .map((c) => `${c.id} | ${c.date} | ${c.category} | ${c.title} | ${c.body ?? ""}`)
      .join("\n");
    const factList = (facts ?? []).map((f) => `${f.id} | ${f.date} | ${f.field} | ${f.value}`).join("\n");
    const documentList = (documents ?? [])
      .map((document) => `${document.id} | ${document.uploaded_at} | ${document.doc_type ?? "Document"} | ${JSON.stringify(document.extracted_json ?? {})}`)
      .join("\n");
    const sourceMaterial = data.scope === "timeline"
      ? `Memory cards (id | date | category | title | body):\n${catalogue}`
      : `Profile facts (id | date | field | value):\n${factList}\n\nDocuments (id | uploaded | type | extracted details):\n${documentList}`;

    const raw = await callGateway([
      {
        role: "system",
        content: `You search the ${data.scope} of a family archive for ${child?.name ?? "this child"} (born ${child?.birthdate ?? "unknown"}).
${sourceMaterial}

Return JSON ONLY: {"answer":"one warm, concise sentence answering the question, or say nothing was recorded","source_ids":["<ids of matching sources, most relevant first>"]}
Only use ids from the supplied ${data.scope}. Return at most 6 ids. If nothing matches, return an empty array.`,
      },
      { role: "user", content: data.question },
    ]);

    try {
      const parsed = JSON.parse(stripFences(raw)) as { answer: string; source_ids?: string[]; card_ids?: string[] };
      const sourceIds = parsed.source_ids ?? parsed.card_ids ?? [];
      const archiveSources = data.scope === "archive"
        ? [
            ...(facts ?? []).filter((fact) => sourceIds.includes(fact.id)).map((fact) => ({ id: fact.id, label: `${fact.field.replaceAll("_", " ")}: ${fact.value}`, kind: "fact" as const })),
            ...(documents ?? []).filter((document) => sourceIds.includes(document.id)).map((document) => ({ id: document.id, label: document.doc_type ?? "Document", kind: "document" as const })),
          ]
        : [];
      return { answer: parsed.answer ?? "", cardIds: data.scope === "timeline" ? sourceIds : [], sources: archiveSources };
    } catch {
      return { answer: "", cardIds: [], sources: [] };
    }
  });

/** Short-lived token so the browser can stream live transcription. */
export const getScribeToken = createServerFn({ method: "POST" }).handler(async () => {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) throw new Error("Live transcription is not connected yet.");
  const res = await fetch("https://api.elevenlabs.io/v1/single-use-token/realtime_scribe", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
  });
  if (!res.ok) throw new Error(`Transcription token failed [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as { token?: string };
  if (!json.token) throw new Error("No transcription token returned.");
  return { token: json.token };
});

/** Short-lived WebRTC token for the private Dossier conversational agent. */
export const getCheckinConversationToken = createServerFn({ method: "POST" }).handler(async () => {
  const apiKey = process.env["ELEVENLABS_API_KEY"];
  if (!apiKey) throw new Error("Voice check-in is not connected yet.");
  const res = await fetch(
    "https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=agent_4901m2n304agegn9k2c013b2nz0c",
    { headers: { "xi-api-key": apiKey } },
  );
  if (!res.ok) throw new Error(`Voice token failed [${res.status}]: ${await res.text()}`);
  const json = (await res.json()) as { token?: string };
  if (!json.token) throw new Error("No voice token returned.");
  return { token: json.token };
});

type CheckinAnswer = { question: "for_child" | "child_moment"; text: string };

/** Read today's completion state. Guests use the shared demo row. */
export const getTodayCheckin = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("daily_checkins")
    .select("answers, created_card_ids, completed_at")
    .eq("checkin_date", today)
    .is("user_id", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return {
    completed: Boolean(data?.completed_at),
    answers: (data?.answers ?? []) as CheckinAnswer[],
    createdCardIds: data?.created_card_ids ?? [],
  };
});

/** Read today's completion state for the signed-in parent. */
export const getTodayCheckinAuthenticated = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await context.supabase
      .from("daily_checkins")
      .select("answers, created_card_ids, completed_at")
      .eq("checkin_date", today)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      completed: Boolean(data?.completed_at),
      answers: (data?.answers ?? []) as CheckinAnswer[],
      createdCardIds: data?.created_card_ids ?? [],
    };
  });

const checkinInput = (input: {
  answers: CheckinAnswer[];
  createdCardIds: string[];
  complete: boolean;
}) => ({
  answers: input.answers ?? [],
  createdCardIds: input.createdCardIds ?? [],
  complete: Boolean(input.complete),
});

/** Persist guest demo progress for today. */
export const saveTodayCheckin = createServerFn({ method: "POST" })
  .inputValidator(checkinInput)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      user_id: null,
      checkin_date: today,
      answers: data.answers,
      created_card_ids: data.createdCardIds,
      completed_at: data.complete ? new Date().toISOString() : null,
    };
    const { data: existing } = await supabaseAdmin
      .from("daily_checkins")
      .select("id")
      .eq("checkin_date", today)
      .is("user_id", null)
      .maybeSingle();
    const query = existing
      ? supabaseAdmin.from("daily_checkins").update(payload).eq("id", existing.id)
      : supabaseAdmin.from("daily_checkins").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Persist signed-in progress for today. */
export const saveTodayCheckinAuthenticated = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(checkinInput)
  .handler(async ({ data, context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const payload = {
      user_id: context.userId,
      checkin_date: today,
      answers: data.answers,
      created_card_ids: data.createdCardIds,
      completed_at: data.complete ? new Date().toISOString() : null,
    };
    const { data: existing } = await context.supabase
      .from("daily_checkins")
      .select("id")
      .eq("checkin_date", today)
      .eq("user_id", context.userId)
      .maybeSingle();
    const query = existing
      ? context.supabase.from("daily_checkins").update(payload).eq("id", existing.id)
      : context.supabase.from("daily_checkins").insert(payload);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Hidden demo control: reopen today's check-in for a guest. */
export const resetTodayCheckin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabaseAdmin
    .from("daily_checkins")
    .delete()
    .eq("checkin_date", today)
    .is("user_id", null);
  if (error) throw new Error(error.message);
  return { ok: true };
});

/** Hidden demo control: reopen today's check-in for the signed-in parent. */
export const resetTodayCheckinAuthenticated = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await context.supabase
      .from("daily_checkins")
      .delete()
      .eq("checkin_date", today)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Pull structured fields out of an uploaded document or photo. */
export const extractDocument = createServerFn({ method: "POST" })
  .inputValidator((input: { documentId: string; dataUrl: string; mimeType: string }) => {
    if (!input?.documentId || !input?.dataUrl) throw new Error("Missing document.");
    return input;
  })
  .handler(async ({ data }) => {
    const isPdf = data.mimeType === "application/pdf";
    const content = isPdf
      ? [
          { type: "text", text: "Extract the fields from this document." },
          {
            type: "file",
            file: { filename: "document.pdf", file_data: data.dataUrl },
          },
        ]
      : [
          { type: "text", text: "Extract the fields from this document." },
          { type: "image_url", image_url: { url: data.dataUrl } },
        ];

    const raw = await callGateway([
      {
        role: "system",
        content: `You read children's health and school documents. Return JSON ONLY:
{"doc_type":"short label like Health check-up or School report","fields":{"Field name":"value"}}
Use the document's own wording for field names. Include height, weight, allergies, vaccinations, teacher comments and dates when present. Maximum 10 fields.`,
      },
      { role: "user", content },
    ]);

    let extracted: { doc_type?: string; fields?: Record<string, string> } = {};
    try {
      extracted = JSON.parse(stripFences(raw));
    } catch {
      extracted = { doc_type: "Document", fields: {} };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("documents")
      .update({
        doc_type: extracted.doc_type ?? "Document",
        extracted_json: extracted.fields ?? {},
      })
      .eq("id", data.documentId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/** Every day a parent showed up: used for the streak and the activity calendar. */
export const getCheckinActivity = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("entries")
    .select("created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const day = new Date(row.created_at as string).toISOString().slice(0, 10);
    counts[day] = (counts[day] ?? 0) + 1;
  }
  return { counts };
});
