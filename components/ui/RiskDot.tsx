import type { RiskLevel } from "@/lib/types";

const levelConfig: Record<RiskLevel, { color: string; ring: string; label: string }> = {
  gruen: { color: "bg-pitch", ring: "ring-pitch/30", label: "Grün" },
  gelb: { color: "bg-amber", ring: "ring-amber/30", label: "Gelb" },
  rot: { color: "bg-brick", ring: "ring-brick/30", label: "Rot" },
};

interface RiskDotProps {
  level: RiskLevel;
  showLabel?: boolean;
}

// Bewusst ein kleiner Punkt mit dünnem Ring statt einer großflächig
// eingefärbten Zeile/Karte — die Ampel soll informieren, nicht dominieren.
export function RiskDot({ level, showLabel = true }: RiskDotProps) {
  const config = levelConfig[level];
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wide text-muted">
      <span
        className={`h-2.5 w-2.5 rounded-full ring-4 ${config.color} ${config.ring}`}
        aria-hidden
      />
      {showLabel && config.label}
    </span>
  );
}
