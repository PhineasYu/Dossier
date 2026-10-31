import { z } from "zod";

export const actionSchema = z.object({
  operation: z.enum(["create", "update", "complete", "delete"]),
  kind: z.enum(["reminder", "event", "draft", "todo"]),
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

export function validateActions(actions: TaskAction[], tasks: AssistantTask[]) {
  if (actions.length > 10) throw new Error("Please plan at most ten tasks at a time.");
  return actions.map((action) => {
    if (!action.title.trim()) throw new Error("A task needs a title.");
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
