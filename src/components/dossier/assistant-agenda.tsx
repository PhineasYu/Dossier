import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  CalendarPlus,
  Check,
  Copy,
  Mail,
  MessageSquare,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getAssistantTasks, changeAssistantTask } from "@/lib/assistant-tasks.functions";
import {
  icsFor,
  isTaskDue,
  mailtoLink,
  smsLink,
  taskDate,
  type AssistantTask,
  type TaskAction,
} from "@/lib/assistant-tasks";

/** Download a dated plan as a calendar file; the phone's calendar then reminds the parent. */
function addToCalendar(task: AssistantTask) {
  const ics = icsFor(task);
  if (!ics) return;
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${task.title.replace(/[^\w\s-]/g, "").trim() || "dossier-plan"}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}
import { isGuest } from "@/lib/guest";

export function AssistantAgenda() {
  const [guest, setGuest] = useState(true);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState("upcoming");
  const [selected, setSelected] = useState<AssistantTask | null>(null);
  const [operation, setOperation] = useState<TaskAction["operation"]>("update");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const fetchTasks = useServerFn(getAssistantTasks);
  const change = useServerFn(changeAssistantTask);
  const client = useQueryClient();
  useEffect(() => {
    setGuest(isGuest());
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const {
    data: tasks = [],
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["assistant-tasks"],
    queryFn: () => fetchTasks(),
    enabled: !guest,
    refetchInterval: 30000,
  });
  const due = tasks.filter((t) => isTaskDue(t, now));
  const pending = tasks.filter((t) => t.status === "pending");
  const rows = tasks.filter((t) =>
    view === "completed"
      ? t.status === "completed"
      : t.status === "pending" && (view !== "drafts" || t.kind === "draft"),
  );
  function select(task: AssistantTask, op: TaskAction["operation"]) {
    setSelected(task);
    setOperation(op);
    setTitle(task.title);
    setDetails(task.details);
    if (task.due_at) {
      const d = new Date(task.due_at);
      setDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16));
    } else setDate("");
  }
  async function save() {
    if (!selected) return;
    setBusy(true);
    try {
      await change({
        data: {
          confirmed: true,
          action: {
            operation,
            kind: selected.kind,
            taskId: selected.id,
            title,
            details,
            dueAt:
              operation === "update"
                ? date
                  ? new Date(date).toISOString()
                  : null
                : selected.due_at,
            timezone:
              operation === "update"
                ? Intl.DateTimeFormat().resolvedOptions().timeZone
                : selected.timezone,
          },
        },
      });
      await client.invalidateQueries({ queryKey: ["assistant-tasks"] });
      setSelected(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the task.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="grid h-11 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 text-[16px] hover:bg-transparent"
        onClick={() => setOpen(true)}
      >
        <span className="flex min-w-0 items-center gap-2">
          <CalendarDays className="shrink-0" />
          <span className="truncate">Your plans</span>
        </span>
        <span className="shrink-0 text-[16px] font-normal text-ink-2">
          {due.length
            ? `${due.length} due`
            : pending.length
              ? `${pending.length} upcoming`
              : "View all"}
        </span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="dossier-readable max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border-0 bg-paper p-5"
        >
          <DialogHeader>
            <DialogTitle className="text-left text-[24px]">Your plans</DialogTitle>
          </DialogHeader>
          {guest ? (
            <p className="text-[17px] text-ink-2">
              Sign in to keep your reminders and family schedule.
            </p>
          ) : (
            <>
              <div className="flex gap-1">
                {["upcoming", "drafts", "completed"].map((v) => (
                  <Button
                    key={v}
                    variant={view === v ? "secondary" : "ghost"}
                    size="sm"
                    className="px-3 capitalize"
                    onClick={() => setView(v)}
                  >
                    {v}
                  </Button>
                ))}
              </div>
              {isError && <p role="alert">Could not load your plans.</p>}
              {isLoading && <p className="py-4 text-[17px] text-ink-2">Loading your plans…</p>}
              {!isLoading && !rows.length && (
                <p className="py-4 text-[17px] text-ink-2">
                  {view === "completed" ? "No completed plans yet." : "No plans here yet."}
                </p>
              )}
              <ul className="divide-y divide-line">
                {rows.map((t) => (
                  <li key={t.id} className="space-y-2 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[17px] font-semibold">{t.title}</p>
                      <span className="text-[14px] text-ink-2">
                        {isTaskDue(t, now) ? "Due" : t.kind}
                      </span>
                    </div>
                    <p className="text-[14px] text-ink-2">{taskDate(t.due_at, t.timezone)}</p>
                    {t.details && (
                      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-2">
                        {t.details}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1">
                      {t.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Complete ${t.title}`}
                          title="Complete"
                          onClick={() => select(t, "complete")}
                        >
                          <Check />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${t.title}`}
                        title="Edit"
                        onClick={() => select(t, "update")}
                      >
                        <Pencil />
                      </Button>
                      {t.due_at && t.status !== "completed" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Add ${t.title} to your calendar`}
                          title="Add to calendar"
                          onClick={() => addToCalendar(t)}
                        >
                          <CalendarPlus />
                        </Button>
                      )}
                      {t.kind === "draft" && (
                        <>
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={mailtoLink(t.title, t.details)}
                              aria-label={`Email ${t.title}`}
                              title="Open in Mail"
                            >
                              <Mail />
                            </a>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={smsLink(t.details)}
                              aria-label={`Text ${t.title}`}
                              title="Open in Messages"
                            >
                              <MessageSquare />
                            </a>
                          </Button>
                        </>
                      )}
                      {t.kind === "draft" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Copy ${t.title}`}
                          title="Copy draft"
                          onClick={() =>
                            void navigator.clipboard
                              .writeText(t.details)
                              .then(() => toast("Draft copied."))
                              .catch(() => toast.error("Could not copy."))
                          }
                        >
                          <Copy />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${t.title}`}
                        title="Delete"
                        onClick={() => select(t, "delete")}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={selected !== null}
        onOpenChange={(value) => {
          if (!value) setSelected(null);
        }}
      >
        <DialogContent
          aria-describedby={undefined}
          className="dossier-readable max-h-[85dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border-0 bg-paper p-5"
        >
          <DialogTitle className="text-[24px]">
            {operation === "update"
              ? "Edit plan"
              : operation === "delete"
                ? "Delete this plan?"
                : "Mark as completed?"}
          </DialogTitle>
          {operation === "update" ? (
            <div className="space-y-3">
              <label className="block text-[15px]">
                Title
                <input
                  className="mt-1 w-full rounded-xl bg-cloud p-3"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>
              <label className="block text-[15px]">
                Details
                <textarea
                  className="mt-1 w-full rounded-xl bg-cloud p-3"
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </label>
              <label className="block text-[15px]">
                Date and time
                <input
                  type="datetime-local"
                  className="mt-1 w-full min-w-0 rounded-xl bg-cloud p-3"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </label>
              <p className="text-[14px] text-ink-2">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>
          ) : (
            <p className="text-[17px]">{selected?.title}</p>
          )}
          <Button disabled={busy || !title.trim()} onClick={() => void save()}>
            Confirm {operation === "update" ? "changes" : operation}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
