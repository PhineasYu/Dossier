import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { confirmAssistantPlan } from "@/lib/assistant-tasks.functions";
import { taskDate, type TaskAction } from "@/lib/assistant-tasks";

export function AssistantPlan({ id, actions }: { id: string; actions: TaskAction[] }) {
  const confirm = useServerFn(confirmAssistantPlan);
  const client = useQueryClient();
  const [status, setStatus] = useState<"pending" | "saved" | "cancelled">("pending");
  const [busy, setBusy] = useState(false);
  async function decide(approve: boolean) {
    setBusy(true);
    try {
      await confirm({ data: { proposalId: id, approve } });
      setStatus(approve ? "saved" : "cancelled");
      await client.invalidateQueries({ queryKey: ["assistant-tasks"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the plan.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      <p className="text-[15px] font-semibold text-action-ink">
        {status === "pending"
          ? "Ready for your confirmation"
          : status === "saved"
            ? "Saved to your plans"
            : "Not saved"}
      </p>
      <ul className="space-y-3">
        {actions.map((a, i) => (
          <li key={i} className="space-y-1">
            <p className="text-[17px] font-semibold text-ink">
              {a.operation === "create" ? a.kind : a.operation} · {a.title}
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
