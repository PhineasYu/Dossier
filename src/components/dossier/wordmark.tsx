import wordmark from "@/assets/dossier-wordmark.png.asset.json";

export function Wordmark({ className = "h-6" }: { className?: string }) {
  return (
    <img
      src={wordmark.url}
      alt="Dossier"
      className={`${className} w-auto object-contain mix-blend-multiply`}
      loading="eager"
    />
  );
}
