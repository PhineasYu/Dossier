import { test } from "node:test";
import { strictEqual, throws } from "node:assert";
import {
  icsFor,
  isTaskDue,
  mailtoLink,
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

const records = { memories: ["card-1"], facts: ["fact-1"] };
const memory: TaskAction = {
  operation: "create",
  kind: "memory",
  taskId: null,
  title: "First tooth",
  details: "Luca lost his first tooth at lunch today.",
  dueAt: null,
  timezone: "Europe/Stockholm",
};
test("asking to remember something becomes a memory to save", () =>
  strictEqual(validateActions([memory], [], records)[0]?.details, memory.details));
test("an empty memory is not saved", () =>
  throws(() => validateActions([{ ...memory, details: " " }], [], records)));
test("only this child's saved memories can be edited or deleted", () => {
  strictEqual(
    validateActions([{ ...memory, operation: "delete", taskId: "card-1" }], [], records).length,
    1,
  );
  throws(() =>
    validateActions([{ ...memory, operation: "delete", taskId: "card-9" }], [], records),
  );
});
test("facts are corrected, never invented directly", () => {
  throws(() => validateActions([{ ...memory, kind: "fact" }], [], records));
  strictEqual(
    validateActions(
      [{ ...memory, kind: "fact", operation: "update", taskId: "fact-1", details: "Mango" }],
      [],
      records,
    )[0]?.details,
    "Mango",
  );
});
test("a dated reminder becomes a calendar file that alerts on time", () => {
  const ics = icsFor(task) ?? "";
  strictEqual(ics.includes("DTSTART:20261101T090000Z"), true);
  strictEqual(ics.includes("TRIGGER:PT0M"), true);
});
test("drafts open in the parent's own mail app", () =>
  strictEqual(mailtoLink("Note", "Hi, Luca"), "mailto:?subject=Note&body=Hi%2C%20Luca"));
