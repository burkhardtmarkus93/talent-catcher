import type { RiskLevel } from "@/lib/types";

const levelConfig: Record<RiskLevel, { bg: string; text: string; dot: string; label: string }> = {
  gruen: { bg: "bg-pitch-dim", text: "text-pitch-dark", dot: "bg-pitch", label: "Grün" },
  gelb: { bg: "bg-amber-dim", text: "text-amber-dark", dot: "bg-amber", label: "Gelb" },
  rot: { bg: "bg-brick-dim", text: "text-brick", dot: "bg-brick", label: "Rot" },
};

interface RiskDotProps {
  level: RiskLevel;
  showLabel?: boolean;
}

// Soft-Tint-Pill statt reinem Punkt: heller Statushintergrund + kräftiger
// Text-/Punktton, analog zu den Ampel-Badges bei Stripe/Linear/Vercel.
// Ohne Label (kompakte Listen) bleibt es ein reiner Punkt ohne Pill-Chrome.
export function RiskDot({ level, showLabel = true }: RiskDotProps) {
  const config = levelConfig[level];

  if (!showLabel) {
    return (
      <span
        className={`inline-flex h-2.5 w-2.5 rounded-full ${config.dot}`}
        aria-label={config.label}
      />
    );
  }

  return (
    <span
      className={`inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${config.bg} ${config.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} aria-hidden />
      {config.label}
    </span>
  );
}
