import { useId, type CSSProperties } from "react";

import { useChildren } from "@/lib/child-context";
import type { BuddyShape } from "@/lib/palette";
import { cn } from "@/lib/utils";

/**
 * Buddies are Dossier's characters: one flat shape, two dot eyes, optional stick limbs.
 * Every child has one (their crayon + shape). Dossier's own AI is the ink burst.
 */

/**
 * "idle" (the default) gives each shape its own personality: flowers sway, stars hop,
 * clouds float, blobs and bursts breathe, beans wobble. The state motions answer what
 * Dossier is doing: bob = listening, squash = speaking, wiggle = sorting. "still" stops
 * the body but the eyes keep blinking.
 */
type Motion = "idle" | "still" | "bob" | "wiggle" | "squash";

/** A stable number per instance so every buddy has its own rhythm (same on server and client). */
function useSeed() {
  const id = useId();
  let seed = 7;
  for (const char of id) seed = (seed * 31 + char.charCodeAt(0)) % 9973;
  return seed;
}

function timing(seed: number, salt: number, base: number, spread: number): CSSProperties {
  const n = (seed * (salt + 3)) % 100;
  return {
    animationDuration: `${(base + (n / 100) * spread).toFixed(2)}s`,
    animationDelay: `-${((n * 7) % 50) / 10}s`,
  };
}

function ring(points: number, outer: number, inner: number, cx = 50, cy = 52, turn = -90) {
  const out: string[] = [];
  for (let i = 0; i < points * 2; i += 1) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = ((turn + (i * 180) / points) * Math.PI) / 180;
    out.push(
      `${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`,
    );
  }
  return out.join(" ");
}

const STAR = ring(5, 46, 24);
const BURST = ring(12, 47, 35, 50, 50, -90);
const PETALS = [0, 72, 144, 216, 288].map((deg) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return { cx: 50 + 24 * Math.cos(a), cy: 52 + 24 * Math.sin(a) };
});

function Body({ shape, fill }: { shape: BuddyShape; fill: string }) {
  switch (shape) {
    case "flower":
      return (
        <g fill={fill}>
          {PETALS.map((p) => (
            <circle key={`${p.cx}-${p.cy}`} cx={p.cx} cy={p.cy} r={22} />
          ))}
          <circle cx={50} cy={52} r={26} />
        </g>
      );
    case "star":
      return (
        <polygon points={STAR} fill={fill} stroke={fill} strokeWidth={14} strokeLinejoin="round" />
      );
    case "cloud":
      return (
        <g fill={fill}>
          <circle cx={30} cy={58} r={20} />
          <circle cx={50} cy={40} r={26} />
          <circle cx={72} cy={56} r={22} />
          <rect x={12} y={56} width={78} height={30} rx={15} />
        </g>
      );
    case "blob":
      return (
        <path
          fill={fill}
          d="M52 8c18 0 27 9 33 21 6 12 9 22 4 36-5 15-18 27-38 27-19 0-33-9-39-24-6-15 0-30 9-41C30 16 38 8 52 8Z"
        />
      );
    case "burst":
      return (
        <polygon points={BURST} fill={fill} stroke={fill} strokeWidth={6} strokeLinejoin="round" />
      );
    case "bean":
      return <rect x={14} y={12} width={72} height={80} rx={34} fill={fill} />;
  }
}

export function Buddy({
  shape,
  color,
  size = 48,
  limbs = false,
  smile = false,
  motion = "idle",
  eyes = "var(--ink)",
  className,
  label,
}: {
  shape: BuddyShape;
  color: string;
  size?: number;
  limbs?: boolean;
  smile?: boolean;
  motion?: Motion;
  eyes?: string;
  className?: string | undefined;
  /** Accessible name. Omit when the buddy is decoration next to a visible name. */
  label?: string | undefined;
}) {
  const seed = useSeed();
  const viewBox = limbs ? "-14 -4 128 128" : "0 0 100 100";
  const eyeY = shape === "cloud" ? 56 : shape === "star" ? 54 : 50;
  const bodyClass =
    motion === "idle" ? `buddy-idle-${shape}` : motion === "still" ? undefined : `buddy-${motion}`;
  const bodyStyle = motion === "idle" ? timing(seed, 1, 2.6, 1.6) : undefined;
  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size}
      className={cn("shrink-0 overflow-visible", className)}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g className={cn("buddy-body", bodyClass)} style={bodyStyle}>
        {limbs && (
          <g
            fill="none"
            stroke="var(--ink)"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              className="buddy-part buddy-wave-l"
              style={timing(seed, 5, 5.5, 3)}
              d="M14 58c-8 2-14-4-18-12"
            />
            <path
              className="buddy-part buddy-wave-r"
              style={timing(seed, 6, 4.5, 3)}
              d="M86 58c8 2 14-4 18-12"
            />
            <path d="M40 90v20h-8" />
            <path d="M60 90v20h8" />
          </g>
        )}
        <g className={shape === "burst" ? "buddy-part buddy-spin" : undefined}>
          <Body shape={shape} fill={color} />
        </g>
        <g className="buddy-part buddy-look" style={timing(seed, 3, 6, 4)}>
          <g className="buddy-part buddy-blink" fill={eyes} style={timing(seed, 2, 3.6, 2.4)}>
            <ellipse cx={41} cy={eyeY} rx={5} ry={7} />
            <ellipse cx={59} cy={eyeY} rx={5} ry={7} />
          </g>
        </g>
        {smile && (
          <path
            d={`M43 ${eyeY + 14}q7 6 14 0`}
            fill="none"
            stroke={eyes}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        )}
      </g>
    </svg>
  );
}

function Sparkle({
  size,
  className,
  style,
}: {
  size: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="-12 -12 24 24"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path
        className="ai-sparkle"
        d="M0 -11C1.2 -3.5 3.5 -1.2 11 0C3.5 1.2 1.2 3.5 0 11C-1.2 3.5 -3.5 1.2 -11 0C-3.5 -1.2 -1.2 -3.5 0 -11Z"
        fill="var(--action)"
        stroke="var(--ink)"
        strokeWidth={1.2}
        strokeLinejoin="round"
        style={style}
      />
    </svg>
  );
}

/**
 * Dossier's AI wears the active child's buddy: Luca's flower listens to Luca's story,
 * Lucy's star to Lucy's. What marks it as AI is the same everywhere: two yellow
 * sparkles that twinkle beside it. No glow, no gradient.
 */
export function AiBuddy({
  size = 40,
  motion = "idle",
  className,
  limbs = false,
}: {
  size?: number;
  motion?: Motion;
  className?: string | undefined;
  limbs?: boolean;
}) {
  const { activeId, lookOf } = useChildren();
  const look = lookOf(activeId);
  const label = motion === "idle" || motion === "still" ? undefined : "Dossier is working";
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center", className)}>
      <Buddy
        shape={look.shape}
        color={look.body}
        size={size}
        motion={motion}
        limbs={limbs}
        smile
        className="relative"
        label={label}
      />
      <Sparkle size={Math.max(12, size * 0.34)} className="absolute -right-[6%] -top-[4%]" />
      <Sparkle
        size={Math.max(8, size * 0.2)}
        className="absolute -left-[2%] top-[18%]"
        style={{ animationDelay: "-1.1s" }}
      />
    </span>
  );
}
