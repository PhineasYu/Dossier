import { cn } from "@/lib/utils";

/** "Dossier" set in the brand serif. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("brand inline-block text-2xl leading-none text-ink", className)}>
      Dossier
    </span>
  );
}
