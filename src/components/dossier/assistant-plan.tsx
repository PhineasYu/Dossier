import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { confirmAssistantPlan } from "@/lib/assistant-tasks.functions";
import { actionLabel, isRecordAction, taskDate, type TaskAction } from "@/lib/assistant-tasks";

export function AssistantPlan({ ids, actions }: { ids: string[]; actions: TaskAction[] }) {
  const confirm = useServerFn(confirmAssistantPlan);
  const client = useQueryClient();
  const [status, setStatus] = useState<"pending" | "saved" | "cancelled">("pending");
  const [busy, setBusy] = useState(false);
  async function decide(approve: boolean) {
    setBusy(true);
    try {
      for (const proposalId of ids) await confirm({ data: { proposalId, approve } });
      setStatus(approve ? "saved" : "cancelled");
      // Plans, memories and facts may all have changed.
      await client.invalidateQueries();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the plan.");
    } finally {
      setBusy(false);
    }
  }
  const touchesRecord = actions.some(isRecordAction);
  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      <p className="text-[15px] font-semibold text-action-ink">
        {status === "pending"
          ? "Ready for your confirmation"
          : status === "saved"
            ? touchesRecord
              ? "Done"
              : "Saved to your plans"
            : "Not saved"}
      </p>
      <ul className="space-y-3">
        {actions.map((a, i) => (
          <li key={i} className="space-y-1">
            <p className="text-[17px] font-semibold text-ink">
              {actionLabel(a)} · {a.title}
            </p>
            {a.dueAt && (
              <p className="text-[14px] text-ink-2">
                {taskDate(a.dueAt, a.timezone)} · {a.timezone}
              </p>
            )}
            {a.details && (
              <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-2">
                {a.details}
              </p>
            )}
          </li>
        ))}
      </ul>
      {status === "pending" && (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => void decide(true)} disabled={busy}>
            <Check /> Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void decide(false)} disabled={busy}>
            <X /> Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
