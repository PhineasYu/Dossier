import { z } from "zod";

export const TASK_KINDS = ["reminder", "event", "draft", "todo"] as const;
/** Record kinds change the family's saved memories and facts instead of the plan list. */
export const RECORD_KINDS = ["memory", "fact"] as const;

export const actionSchema = z.object({
  operation: z.enum(["create", "update", "complete", "delete"]),
  kind: z.enum([...TASK_KINDS, ...RECORD_KINDS]),
  /** Id of the task, memory or fact being changed; null when creating. */
  taskId: z.string().nullable(),
  title: z.string(),
  details: z.string(),
  dueAt: z.string().nullable(),
  timezone: z.string(),
});
export const planSchema = z.object({ answer: z.string(), actions: z.array(actionSchema) });
export type TaskAction = z.infer<typeof actionSchema>;
export type AssistantTask = {
  id: string;
  child_id: string | null;
  kind: string;
  title: string;
  details: string;
  due_at: string | null;
  timezone: string;
  status: string;
};

export function isRecordAction(action: Pick<TaskAction, "kind">) {
  return (RECORD_KINDS as readonly string[]).includes(action.kind);
}

/** Ids of the selected child's saved memories (cards) and facts the agent may change. */
export type RecordIds = { memories: string[]; facts: string[] };

function validateRecordAction(action: TaskAction, records: RecordIds) {
  if (action.operation === "complete") throw new Error("Saved memories cannot be completed.");
  if (action.kind === "fact" && action.operation === "create") {
    throw new Error("Facts are saved by saving a memory; Dossier sorts them automatically.");
  }
  if (action.operation === "create") {
    if (!action.details.trim()) throw new Error("Tell Dossier what to remember.");
    return;
  }
  const known = action.kind === "memory" ? records.memories : records.facts;
  if (!known.includes(action.taskId ?? "")) {
    throw new Error(`That ${action.kind} is not in this child's record.`);
  }
  if (action.operation === "update" && !action.details.trim()) {
    throw new Error(`Say what the ${action.kind} should say instead.`);
  }
}

export function validateActions(
  actions: TaskAction[],
  tasks: AssistantTask[],
  records: RecordIds = { memories: [], facts: [] },
) {
  if (actions.length > 10) throw new Error("Please plan at most ten tasks at a time.");
  return actions.map((action) => {
    if (!action.title.trim()) throw new Error("A task needs a title.");
    if (isRecordAction(action)) {
      validateRecordAction(action, records);
      return { ...action, title: action.title.trim(), details: action.details.trim(), dueAt: null };
    }
    if (action.operation !== "create" && !tasks.some((task) => task.id === action.taskId)) {
      throw new Error("That task is not in your account.");
    }
    if (
      action.dueAt &&
      (!/[zZ]$|[+-]\d{2}:\d{2}$/.test(action.dueAt) || !Number.isFinite(Date.parse(action.dueAt)))
    ) {
      throw new Error("Please specify a valid date, time and timezone.");
    }
    try {
      new Intl.DateTimeFormat("en", { timeZone: action.timezone });
    } catch {
      throw new Error("Please specify a valid timezone.");
    }
    if (
      (action.kind === "event" || action.kind === "reminder") &&
      ["create", "update"].includes(action.operation) &&
      !action.dueAt
    ) {
      throw new Error("Please provide a date and time for this reminder or event.");
    }
    return {
      ...action,
      title: action.title.trim(),
      dueAt: action.dueAt ? new Date(action.dueAt).toISOString() : null,
    };
  });
}

export function requireConfirmation(confirmed: boolean) {
  if (confirmed !== true) throw new Error("Confirm the change before saving.");
}
export function isTaskDue(task: AssistantTask, now: number) {
  return task.status === "pending" && task.due_at !== null && Date.parse(task.due_at) <= now;
}
export function taskDate(value: string | null, timezone: string) {
  return value
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: timezone,
      }).format(new Date(value))
    : "No date";
}

/** How a proposed change reads in the confirmation list. */
export function actionLabel(action: Pick<TaskAction, "operation" | "kind">) {
  if (action.kind === "memory") {
    return { create: "Save memory", update: "Edit memory", delete: "Delete memory" }[
      action.operation as "create" | "update" | "delete"
    ];
  }
  if (action.kind === "fact") return action.operation === "delete" ? "Delete fact" : "Edit fact";
  return action.operation === "create" ? sentence(action.kind) : sentence(action.operation);
}

function sentence(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** A mail draft the parent sends from their own account (Dossier never sends). */
export function mailtoLink(title: string, details: string) {
  return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(details)}`;
}

/** A text-message draft for the phone's Messages app. */
export function smsLink(details: string) {
  return `sms:?&body=${encodeURIComponent(details)}`;
}

function icsTime(iso: string) {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

function icsText(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/([,;])/g, "\\$1");
}

/**
 * A calendar file for a dated reminder or event. Adding it to the phone's calendar gives
 * the parent a real notification: at the time for a reminder, 30 minutes early for an event.
 */
export function icsFor(task: Pick<AssistantTask, "id" | "kind" | "title" | "details" | "due_at">) {
  if (!task.due_at) return null;
  const start = Date.parse(task.due_at);
  const minutes = task.kind === "event" ? 60 : 15;
  const end = new Date(start + minutes * 60_000).toISOString();
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dossier//Family plans//EN",
    "BEGIN:VEVENT",
    `UID:${task.id}@dossier`,
    `DTSTAMP:${icsTime(new Date().toISOString())}`,
    `DTSTART:${icsTime(task.due_at)}`,
    `DTEND:${icsTime(end)}`,
    `SUMMARY:${icsText(task.title)}`,
    ...(task.details ? [`DESCRIPTION:${icsText(task.details)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(task.title)}`,
    `TRIGGER:${task.kind === "event" ? "-PT30M" : "PT0M"}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
