import Image from "next/image";
import lockup from "@/public/brand/lockup-app.png";

// Vollständige Bildmarke (Icon + ausgeschriebenes "TALENT CATCHER"),
// echter Ausschnitt aus dem Original-Logo statt einer abstrakten
// Einzel-Grafik — für Kontexte mit genug Platz (Login/Signup), wo die
// Bildmarke allein sonst nicht als Talent-Catcher-Logo erkennbar war.
export function LogoLockup({
  height = 120,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  const width = Math.round((height * lockup.width) / lockup.height);
  return (
    <Image
      src={lockup}
      alt="Talent Catcher"
      height={height}
      width={width}
      className={`inline-block ${className}`}
      priority
    />
  );
}
