import { motion } from "motion/react";

import { Buddy } from "@/components/dossier/buddy";
import { CRAYON_HEX, type ChildLook } from "@/lib/palette";

/**
 * The doorframe is Dossier's one recurring image: pencil marks on a frame,
 * buddies standing in it. It opens the app, sits on the landing page and
 * becomes the growth chart in the archive.
 */

const INK = "var(--ink)";

/** Decorative scene for the landing page and the splash. `grow` animates the small buddy past the marks. */
export function DoorframeScene({
  grow = false,
  className,
}: {
  grow?: boolean;
  className?: string;
}) {
  const floor = 286;
  return (
    <svg
      viewBox="0 0 360 300"
      className={className}
      role="img"
      aria-label="Two buddies standing in a doorframe with pencil height marks"
    >
      {/* confetti: each piece moves on its own clock */}
      <g transform="translate(300 34) rotate(14)">
        <polygon
          className="confetti-twinkle"
          points="0,-13 4,-4 13,-3 6,3 8,13 0,7 -8,13 -6,3 -13,-3 -4,-4"
          fill={CRAYON_HEX.sun.body}
          stroke={CRAYON_HEX.sun.body}
          strokeWidth={5}
          strokeLinejoin="round"
        />
      </g>
      <circle className="confetti-drift" cx={28} cy={92} r={8} fill={CRAYON_HEX.tomato.body} />
      <circle
        className="confetti-drift"
        style={{ animationDelay: "-1.6s", animationDuration: "5s" }}
        cx={336}
        cy={150}
        r={6}
        fill={CRAYON_HEX.sky.body}
      />
      <g transform="translate(22 196)">
        <g className="confetti-turn" fill={CRAYON_HEX.aqua.body}>
          <circle cx={0} cy={-7} r={6} />
          <circle cx={7} cy={0} r={6} />
          <circle cx={0} cy={7} r={6} />
          <circle cx={-7} cy={0} r={6} />
        </g>
      </g>
      <g transform="translate(330 248)">
        <polygon
          className="confetti-twinkle"
          style={{ animationDelay: "-1.1s", animationDuration: "3.2s" }}
          points="0,-8 2.5,-2.5 8,0 2.5,2.5 0,8 -2.5,2.5 -8,0 -2.5,-2.5"
          fill={CRAYON_HEX.bubblegum.body}
        />
      </g>
      {/* frame */}
      <path
        d={`M70 ${floor} V26 H290 V${floor}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d={`M44 ${floor} H316`} stroke={INK} strokeWidth={1.75} strokeLinecap="round" />

      {/* pencil marks on the left jamb */}
      <g stroke={INK} strokeWidth={1.5} strokeLinecap="round">
        <path d="M70 118h18" />
        <path d="M70 148h14" />
        <path d="M70 176h18" />
        <path d="M70 206h14" />
        <path d="M70 232h18" />
      </g>
      <g
        fill="var(--ink-2)"
        fontFamily="var(--font-sans)"
        fontSize={11}
        fontWeight={600}
        textAnchor="end"
      >
        <text x={64} y={122}>
          Lucy 9
        </text>
        <text x={64} y={180}>
          Luca 6
        </text>
        <text x={64} y={236}>
          Luca 3
        </text>
      </g>

      {/* the older buddy */}
      <g transform={`translate(72 ${floor - 134})`}>
        <Buddy shape="star" color={CRAYON_HEX.lilac.body} size={150} limbs />
      </g>

      {/* the younger buddy, who grows */}
      {grow ? (
        <motion.g
          initial={{ scaleY: 0.5, scaleX: 0.5 }}
          animate={{ scaleY: [0.5, 0.75, 1.05], scaleX: [0.5, 0.75, 1.05] }}
          transition={{ duration: 1.3, ease: "easeInOut", times: [0, 0.5, 1] }}
          style={{ originX: 0.5, originY: 1 }}
        >
          <g transform={`translate(196 ${floor - 89})`}>
            <Buddy shape="flower" color={CRAYON_HEX.sky.body} size={100} limbs />
          </g>
        </motion.g>
      ) : (
        <g transform={`translate(196 ${floor - 89})`}>
          <Buddy shape="flower" color={CRAYON_HEX.sky.body} size={100} limbs smile />
        </g>
      )}
    </svg>
  );
}

type Mark = { cm: number; date: string };

function monthLabel(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

/**
 * Height history as pencil marks on the top half of a doorframe. The child's buddy
 * peeks up from below with the top of its head at the newest mark.
 */
export function GrowthDoorframe({
  marks,
  look,
  name,
}: {
  marks: Mark[];
  look: ChildLook;
  name: string;
}) {
  const sorted = [...marks].sort((a, b) => a.date.localeCompare(b.date));
  const latest = sorted.at(-1);
  if (!latest) return null;
  const height = 236;
  const top = 46;
  const bottom = 206;
  const lo = Math.min(...sorted.map((m) => m.cm)) - 3;
  const hi = Math.max(...sorted.map((m) => m.cm)) + 3;
  const y = (cm: number) => bottom - ((cm - lo) / Math.max(hi - lo, 1)) * (bottom - top);
  const jamb = 150;

  // Keep two-line labels at least 30 apart; ticks stay where they belong.
  const labels = [...sorted].reverse().map((mark) => ({ mark, ly: y(mark.cm) }));
  for (let i = 1; i < labels.length; i += 1) {
    const previous = labels[i - 1]!;
    const current = labels[i]!;
    if (current.ly - previous.ly < 30) current.ly = previous.ly + 30;
  }

  const buddySize = 150;
  const headTop = (12 / 128) * buddySize;

  return (
    <svg
      viewBox={`0 0 320 ${height}`}
      className="w-full"
      role="img"
      aria-label={`${name}'s height marks: ${sorted.map((m) => `${m.cm} cm in ${monthLabel(m.date)}`).join(", ")}`}
    >
      <path
        d={`M${jamb} ${height + 4} V16 H304 V${height + 4}`}
        fill="none"
        stroke={INK}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g transform={`translate(${jamb + 22} ${y(latest.cm) - headTop})`}>
        <Buddy shape={look.shape} color={look.body} size={buddySize} limbs />
      </g>
      {labels.map(({ mark, ly }, index) => {
        const isLatest = index === 0;
        const my = y(mark.cm);
        return (
          <g key={`${mark.date}-${mark.cm}`}>
            <path
              d={`M${jamb - 6} ${my} H${jamb + (isLatest ? 150 : 16)}`}
              stroke={isLatest ? INK : "var(--ink-2)"}
              strokeWidth={isLatest ? 1.75 : 1.5}
              strokeDasharray={isLatest ? "6 5" : undefined}
              strokeLinecap="round"
            />
            <text
              x={jamb - 14}
              y={ly + 4}
              textAnchor="end"
              fontFamily="var(--font-sans)"
              fontSize={14}
              fontWeight={700}
              fill="var(--ink)"
            >
              {mark.cm} cm
            </text>
            <text
              x={jamb - 14}
              y={ly + 19}
              textAnchor="end"
              fontFamily="var(--font-sans)"
              fontSize={11.5}
              fill="var(--ink-3)"
            >
              {monthLabel(mark.date)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
