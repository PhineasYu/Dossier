import familySample from "@/assets/moment-family-sample.jpg.asset.json";
import artSample from "@/assets/moment-outdoors-sample.jpg.asset.json";
import { AudioLines } from "lucide-react";

export type MomentPreviewKind = "photo" | "art" | "audio";

/** Presentation-only samples, never written to a child's saved record. */
export function MomentPreview({ kind }: { kind: MomentPreviewKind }) {
  if (kind === "audio") {
    return (
      <div
        className="mt-4 flex items-center gap-3 border-t border-paper/80 pt-4"
        aria-label="Sample audio waveform, no recording attached"
      >
        <AudioLines className="size-5 shrink-0 text-action-ink" aria-hidden="true" />
        <svg
          viewBox="0 0 240 40"
          className="h-10 min-w-0 flex-1 text-action-ink"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          {Array.from({ length: 60 }, (_, i) => {
            const height = 5 + Math.round(Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.38)) * 30);
            return (
              <line
                key={i}
                x1={i * 4 + 1}
                x2={i * 4 + 1}
                y1={(40 - height) / 2}
                y2={(40 + height) / 2}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
        <span className="shrink-0 text-[14px] text-ink-2">Audio sample</span>
      </div>
    );
  }
  return (
    <figure className="relative mt-4 overflow-hidden rounded-2xl">
      <img
        src={kind === "art" ? artSample.url : familySample.url}
        alt={
          kind === "art"
            ? "Sample photo of a child with painted hands"
            : "Sample photo of children playing outdoors"
        }
        loading="lazy"
        className="aspect-[16/10] w-full object-cover"
      />
      <figcaption className="absolute bottom-2 left-2 rounded-full bg-paper px-2.5 py-1 text-[14px] text-ink-2">
        Sample photo · Pexels
      </figcaption>
    </figure>
  );
}
