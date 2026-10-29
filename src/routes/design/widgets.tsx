import { createFileRoute } from "@tanstack/react-router";
import { AudioLines, Sparkles, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { Buddy } from "@/components/dossier/buddy";
import { Wordmark } from "@/components/dossier/wordmark";
import { CRAYON_HEX } from "@/lib/palette";

/**
 * Design preview of the iPhone widgets and lock-screen shortcuts Dossier will ship
 * (see docs/BACKLOG.md). Static data, drawn with the real Buddies components.
 */
export const Route = createFileRoute("/design/widgets")({
  head: () => ({
    meta: [
      { title: "Buddies widgets preview | Dossier" },
      { name: "description", content: "Dossier family widgets: everyday memories, gentle prompts, growth and allergies at a glance." },
      { property: "og:title", content: "Buddies widgets preview | Dossier" },
      { property: "og:description", content: "A preview of Dossier family memories, prompts and growth widgets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WidgetsPreview,
});

function Phone({ children, label }: { children: ReactNode; label: string }) {
  return (
    <figure className="flex flex-col items-center gap-4">
      <div className="relative h-[780px] w-[360px] overflow-hidden rounded-[56px] border-[10px] border-ink bg-ink">
        <div className="absolute left-1/2 top-2.5 z-20 h-7 w-28 -translate-x-1/2 rounded-full bg-ink" />
        <div className="relative h-full w-full overflow-hidden rounded-[46px]">{children}</div>
      </div>
      <figcaption className="text-[15px] font-semibold text-ink-2">{label}</figcaption>
    </figure>
  );
}

function StatusBar({ light = false }: { light?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between px-8 pt-4 text-[15px] font-semibold ${light ? "text-white" : "text-ink"}`}
    >
      <span>21:04</span>
      <span className="text-[12px]">5G 82%</span>
    </div>
  );
}

function Widget({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-[24px] p-4 ${className}`}>{children}</div>;
}

function RecordDot({ size = 40 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-full bg-action text-on-action"
      style={{ width: size, height: size }}
    >
      <AudioLines className="size-[45%]" strokeWidth={2.2} />
    </span>
  );
}

function HomeScreen() {
  return (
    <div className="h-full bg-sky-soft">
      <StatusBar />
      <div className="grid grid-cols-2 gap-4 px-5 pt-6">
        {/* medium: tonight's prompt card */}
        <Widget className="col-span-2 flex h-[158px] flex-col justify-between bg-sun-soft">
          <div className="flex items-start justify-between gap-3">
            <p className="display text-[23px] text-ink">What made them laugh today?</p>
            <div className="flex -space-x-3">
              <Buddy shape="flower" color={CRAYON_HEX.sky.body} size={40} />
              <Buddy shape="star" color={CRAYON_HEX.lilac.body} size={40} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-ink-2">Tonight&apos;s card</span>
            <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-action px-3 py-1.5 text-[13px] font-semibold text-on-action">
              <AudioLines className="size-4" /> Tell Dossier
            </span>
          </div>
        </Widget>

        {/* small: one-tap capture for a child */}
        <Widget className="flex h-[158px] flex-col justify-between bg-paper">
          <div className="flex items-start justify-between">
            <Buddy shape="flower" color={CRAYON_HEX.sky.body} size={58} limbs />
            <RecordDot size={36} />
          </div>
          <p className="text-[14px] font-semibold leading-tight text-ink">
            Something about Luca?
            <span className="block text-[12px] font-normal text-ink-3">Tap and talk</span>
          </p>
        </Widget>

        {/* small: allergies at a glance */}
        <Widget className="flex h-[158px] flex-col bg-danger-soft">
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-danger">
            <TriangleAlert className="size-4" /> Allergies
          </p>
          <ul className="mt-3 space-y-2 text-[13px] leading-tight">
            <li>
              <span className="font-semibold">Luca</span>
              <span className="block text-ink-2">Mango, lips swell</span>
            </li>
            <li>
              <span className="font-semibold">Lucy</span>
              <span className="block text-ink-2">Penicillin</span>
            </li>
          </ul>
        </Widget>

        {/* small: a memory from back then */}
        <Widget className="flex h-[158px] -rotate-[1.5deg] flex-col justify-between bg-paper ring-1 ring-line">
          <p className="text-[12px] font-semibold text-ink-3">A year ago</p>
          <p className="text-[15px] font-bold leading-snug text-ink">Lucy learned to whistle</p>
          <p className="text-[12px] text-ink-2">Practised for three days straight.</p>
        </Widget>

        {/* small: pencil marks */}
        <Widget className="flex h-[158px] flex-col justify-between bg-lilac-soft">
          <p className="text-[13px] font-bold">Lucy, 112 cm</p>
          <div className="flex items-end justify-between">
            <span className="text-[12px] leading-tight text-ink-2">
              +3 cm
              <span className="block">since spring</span>
            </span>
            <Buddy shape="star" color={CRAYON_HEX.lilac.body} size={66} limbs />
          </div>
        </Widget>
      </div>

      {/* dock */}
      <div className="absolute inset-x-4 bottom-5">
        <div className="liquid-glass flex h-[84px] items-center justify-around rounded-[32px] px-4">
          <span className="grid size-[60px] place-items-center rounded-[16px] bg-action">
            <Buddy shape="burst" color={CRAYON_HEX.sun.soft} size={40} />
          </span>
          <span className="size-[60px] rounded-[16px] bg-paper/80" />
          <span className="size-[60px] rounded-[16px] bg-paper/80" />
          <span className="size-[60px] rounded-[16px] bg-paper/80" />
        </div>
      </div>
    </div>
  );
}

function LockScreen() {
  return (
    <div className="relative h-full bg-ink-2 text-white">
      <div className="absolute inset-0 bg-[#3a3550]" />
      <div className="relative">
        <StatusBar light />
        <p className="mt-6 text-center text-[17px] font-semibold opacity-90">Thursday 30 October</p>
        <p className="text-center text-[84px] font-bold leading-none tracking-tight">21:04</p>

        {/* lock-screen widgets: one circular capture, one rectangular reminder */}
        <div className="mt-5 flex items-center justify-center gap-3 px-8">
          <span className="grid size-[64px] place-items-center rounded-full bg-white/18 backdrop-blur-md">
            <AudioLines className="size-7" />
          </span>
          <span className="flex h-[64px] flex-1 flex-col justify-center rounded-[18px] bg-white/18 px-4 backdrop-blur-md">
            <span className="flex items-center gap-1 text-[12px] font-semibold opacity-80">
              <Sparkles className="size-3.5" /> Dossier noticed
            </span>
            <span className="text-[14px] font-semibold leading-tight">
              Lucy slept badly before the play
            </span>
          </span>
        </div>

        {/* a gentle notification, never a task */}
        <div className="mx-4 mt-[230px] rounded-[22px] bg-white/85 p-4 text-ink backdrop-blur-xl">
          <div className="flex items-center gap-2 text-[12px] font-semibold text-ink-3">
            <span className="grid size-5 place-items-center rounded-[6px] bg-action">
              <Buddy shape="burst" color={CRAYON_HEX.sun.soft} size={14} motion="still" />
            </span>
            DOSSIER · now
          </div>
          <p className="mt-1.5 text-[15px] font-semibold">Anything from today worth keeping?</p>
          <p className="text-[13px] text-ink-2">Hold the Action Button and just talk.</p>
        </div>

        <div className="mt-6 flex justify-between px-12">
          <span className="grid size-12 place-items-center rounded-full bg-white/18 backdrop-blur-md">
            <AudioLines className="size-5" />
          </span>
          <span className="grid size-12 place-items-center rounded-full bg-white/18 text-[11px] font-semibold backdrop-blur-md">
            Cam
          </span>
        </div>
      </div>
    </div>
  );
}

function WidgetsPreview() {
  return (
    <main className="min-h-screen bg-paper px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <Wordmark className="text-[30px]" />
        <h1 className="display mt-3 text-[48px] text-ink">One tap from anywhere</h1>
        <p className="mt-3 max-w-xl text-[16px] text-ink-2">
          Widgets keep the family&apos;s context on the home screen; the Action Button and the
          lock-screen control open a voice note straight to Dossier.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-12">
          <Phone label="Home Screen widgets">
            <HomeScreen />
          </Phone>
          <Phone label="Lock Screen and Action Button">
            <LockScreen />
          </Phone>
        </div>
      </div>
    </main>
  );
}
