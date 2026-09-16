import parentChildLine from "@/assets/parent-child-line-transparent.png";

export function LandingIllustration() {
  return (
    <figure className="flex w-full max-w-lg items-center justify-center" aria-label="Parent and child walking hand in hand">
      <img
        src={parentChildLine}
        alt="A continuous line drawing of a parent and child walking hand in hand"
        className="h-auto max-h-[46vh] w-full object-contain"
      />
    </figure>
  );
}