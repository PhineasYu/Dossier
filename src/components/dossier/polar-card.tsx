import qrAsset from "@/assets/dossier-qr.svg.asset.json";
import { Buddy } from "@/components/dossier/buddy";
import { CRAYON_HEX } from "@/lib/palette";

// TODO: swap for the real Polar subscription checkout link.
export const POLAR_CHECKOUT_URL = "https://polar.sh/dossier";

/** Dossier+ as a poster: action-soft card (it is an action), condensed headline, QR on white. */
export function PolarCard() {
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-action-soft px-6 pb-7 pt-8 text-ink">
      <p className="text-sm font-semibold">Dossier+</p>
      <h2 className="display mt-2 max-w-[14rem] text-[48px]">Keep every year</h2>
      <p className="mt-3 max-w-[17rem] text-[15px] leading-snug">
        Unlimited memories, the full archive and every document, kept for the whole childhood.
      </p>
      <a
        href={POLAR_CHECKOUT_URL}
        target="_blank"
        rel="noreferrer"
        className="press mt-6 inline-block rounded-3xl bg-paper p-4"
        aria-label="Open the Dossier+ checkout"
      >
        <img
          src={qrAsset.url}
          alt="QR code for the Dossier+ checkout"
          width={148}
          height={148}
          className="block size-[148px]"
        />
      </a>
      <p className="mt-3 text-sm font-semibold">Scan with your phone camera</p>
      <div className="pointer-events-none absolute -bottom-3 -right-4">
        <Buddy shape="cloud" color={CRAYON_HEX.aqua.body} size={128} limbs smile />
      </div>
    </section>
  );
}
