import { useState } from "react";

import { ArchiveChat } from "@/components/dossier/archive-chat";
import { BrainDump } from "@/components/dossier/brain-dump";
import { AssistantAgenda } from "@/components/dossier/assistant-agenda";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useChildren } from "@/lib/child-context";

export function HomeAssistant() {
  const { active } = useChildren();
  const [captureMode, setCaptureMode] = useState<"voice" | "text" | null>(null);

  return (
    <>
      <ArchiveChat key={active?.id ?? "family"} compact onCapture={setCaptureMode} />
      <AssistantAgenda />
      <Dialog
        open={captureMode !== null}
        onOpenChange={(open) => {
          if (!open) setCaptureMode(null);
        }}
      >
        <DialogContent className="dossier-readable max-h-[85dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-3xl border-0 bg-paper p-5 sm:p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-[24px]">Tell Dossier</DialogTitle>
            <DialogDescription>Say it once. Dossier sorts it.</DialogDescription>
          </DialogHeader>
          {captureMode && <BrainDump key={captureMode} initialMode={captureMode} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
