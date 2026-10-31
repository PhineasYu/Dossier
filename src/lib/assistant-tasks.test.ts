import { test } from "node:test";
import { strictEqual, throws } from "node:assert";
import {
  isTaskDue,
  requireConfirmation,
  validateActions,
  type AssistantTask,
  type TaskAction,
} from "./assistant-tasks";
const task: AssistantTask = {
  id: "own",
  child_id: null,
  kind: "reminder",
  title: "School",
  details: "",
  due_at: "2026-11-01T09:00:00Z",
  timezone: "Europe/Stockholm",
  status: "pending",
};
const action: TaskAction = {
  operation: "create",
  kind: "reminder",
  taskId: null,
  title: "School",
  details: "",
  dueAt: "2026-11-01T10:00:00+01:00",
  timezone: "Europe/Stockholm",
};
test("tasks cannot mutate without confirmation", () => throws(() => requireConfirmation(false)));
test("Dossier reminders become due inside the app at their saved time", () =>
  strictEqual(isTaskDue(task, Date.parse("2026-11-01T09:00:00Z")), true));
test("completed reminders no longer appear due", () =>
  strictEqual(
    isTaskDue({ ...task, status: "completed" }, Date.parse("2026-11-02T09:00:00Z")),
    false,
  ));
test("reminder timezone preserves Stockholm ten o'clock", () =>
  strictEqual(validateActions([action], [])[0]?.dueAt, "2026-11-01T09:00:00.000Z"));
test("reminders need an explicit time", () =>
  throws(() => validateActions([{ ...action, dueAt: null }], [])));
test("tasks cannot update another account's task", () =>
  throws(() => validateActions([{ ...action, operation: "update", taskId: "other" }], [task])));
