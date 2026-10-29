import qrAsset from "@/assets/dossier-qr.svg.asset.json";

// TODO: swap for the real Polar subscription checkout link.
export const POLAR_CHECKOUT_URL = "https://polar.sh/dossier";

/** Full-width subscription copy above a compact, centred QR. */
export function PolarCard() {
  return (
    <section className="rounded-3xl bg-cloud p-5 text-ink sm:p-6" aria-label="Dossier+">
      <div className="mb-3 flex justify-end">
        <span className="rounded-full bg-paper px-3 py-1 text-[17px] font-semibold">Dossier+</span>
      </div>
      <h2 className="text-[28px] font-bold leading-tight">Keep every year</h2>
      <p className="mt-2 text-[17px] leading-relaxed text-ink-2">
        Unlimited memories, the full archive and every document, kept for the whole childhood.
      </p>
      <div className="mt-4 flex flex-col items-center gap-2 border-t border-line pt-4">
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
        <p className="text-[14px] text-ink-2">Scan with your phone camera</p>
      </div>
    </section>
  );
}
