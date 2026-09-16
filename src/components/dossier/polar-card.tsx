import { QRCodeSVG } from "qrcode.react";

// TODO: swap for the real Polar subscription checkout link.
export const POLAR_CHECKOUT_URL = "https://polar.sh/dossier";

export function PolarCard() {
  return (
    <div className="material-card relative overflow-hidden p-7 text-center">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="shimmer-sweep absolute inset-y-[-40%] w-1/3"
          style={{
            background:
              "linear-gradient(90deg, transparent, color-mix(in oklch, var(--child) 26%, transparent), transparent)",
          }}
        />
      </div>
      <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Dossier+</p>
      <h2 className="mt-3 font-display text-2xl leading-snug">
        Keep every year of their story
      </h2>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
        A subscription for the whole childhood: unlimited memories, the full profile archive and
        every document kept safe.
      </p>
      <a
        href={POLAR_CHECKOUT_URL}
        target="_blank"
        rel="noreferrer"
        className="relative mx-auto mt-6 block w-fit rounded-xl border border-line bg-surface p-4"
      >
        <QRCodeSVG value={POLAR_CHECKOUT_URL} size={168} bgColor="var(--surface)" fgColor="var(--ink)" />
      </a>
      <p className="mt-4 font-display text-lg">Scan it</p>
      <p className="text-xs text-muted-foreground">Subscribe in about twenty seconds</p>
    </div>
  );
}
