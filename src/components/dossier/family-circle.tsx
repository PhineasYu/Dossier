import { UserPlus } from "lucide-react";

import { Buddy } from "@/components/dossier/buddy";
import { Button } from "@/components/ui/button";
import { CRAYON_HEX } from "@/lib/palette";

/**
 * Who keeps this child's file. Everyone who looks after a child sees what they need:
 * grandparents the memories, a babysitter allergies and routines, a teacher what school
 * should know. Invitations are not built yet, so the button says so.
 */
const CIRCLE = [
  { name: "You", role: "Everything", shape: "blob", color: CRAYON_HEX.sun.body },
  {
    name: "Grandma",
    role: "Memories and photos",
    shape: "cloud",
    color: CRAYON_HEX.bubblegum.body,
  },
  {
    name: "Babysitter",
    role: "Allergies, food, routines",
    shape: "bean",
    color: CRAYON_HEX.aqua.body,
  },
  { name: "Teacher", role: "What school should know", shape: "burst", color: CRAYON_HEX.sky.body },
] as const;

export function FamilyCircle({ name }: { name: string }) {
  return (
    <section className="tile p-5" aria-label="Family circle">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-bold">Who looks after {name}</h2>
        <span className="rounded-full bg-paper px-2.5 py-0.5 text-[12px] font-semibold text-ink-3">
          Coming soon
        </span>
      </div>
      <p className="mt-1 text-[14px] text-ink-2">
        Each person sees only what they need to care for {name}.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-2">
        {CIRCLE.map((person) => (
          <li key={person.name} className="flex items-center gap-3 rounded-2xl bg-paper p-3">
            <Buddy shape={person.shape} color={person.color} size={34} />
            <span className="min-w-0 leading-tight">
              <span className="block text-[15px] font-semibold">{person.name}</span>
              <span className="block truncate text-[12px] text-ink-3">{person.role}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button type="button" variant="outline" size="sm" className="mt-4" disabled>
        <UserPlus /> Invite someone
      </Button>
    </section>
  );
}
