import qrAsset from "@/assets/dossier-qr.svg.asset.json";

// TODO: swap for the real Polar subscription checkout link.
export const POLAR_CHECKOUT_URL = "https://polar.sh/dossier";

/** Full-width subscription copy above a compact, centred QR. */
export function PolarCard() {
  return (
    <section
      className="rounded-3xl premium-card p-5 text-premium-foreground sm:p-6"
      aria-label="Dossier+"
    >
      <h2 className="display pt-1 text-[44px] leading-none tracking-tight sm:text-[56px]">
        Dossier<span className="ml-0.5 align-super text-[0.7em] text-premium-muted">+</span>
      </h2>
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
