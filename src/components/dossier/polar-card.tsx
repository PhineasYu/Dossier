import qrAsset from "@/assets/dossier-qr.svg.asset.json";
import { Sparkles } from "lucide-react";

// TODO: swap for the real Polar subscription checkout link.
export const POLAR_CHECKOUT_URL = "https://polar.sh/dossier";

/** Full-width subscription copy above a compact, centred QR. */
export function PolarCard() {
  return (
    <section
      className="premium-card rounded-3xl border border-premium-line bg-premium p-5 text-premium-foreground sm:p-6"
      aria-label="Dossier+"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="display min-w-0 pt-1 text-[28px] sm:text-[38px]">Keep every year</h2>
        <span className="premium-badge inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-2 text-sm font-semibold text-on-action sm:gap-1.5 sm:px-3 sm:text-[17px]">
          <Sparkles className="size-3.5 sm:size-4" strokeWidth={1.25} aria-hidden="true" />
          Dossier+
        </span>
      </div>
      <p className="mt-4 text-[17px] leading-relaxed text-premium-muted">
        Unlimited memories, the full archive and every document, kept for the whole childhood.
      </p>
      <div className="mt-4 flex flex-col items-center gap-2 border-t border-premium-line pt-4">
        <a
          href={POLAR_CHECKOUT_URL}
          target="_blank"
          rel="noreferrer"
          className="press inline-block rounded-xl bg-paper p-2.5 focus-visible:outline-2 focus-visible:outline-ring"
          aria-label="Open the Dossier+ checkout"
        >
          <img
            src={qrAsset.url}
            alt="QR code for the Dossier+ checkout"
            width={112}
            height={112}
            className="block size-28"
          />
        </a>
        <p className="text-[14px] text-premium-muted">Scan with your phone camera</p>
      </div>
    </section>
  );
}
