import Image from "next/image";
import logoIcon from "@/public/brand/icon.png";

// Echter Ausschnitt aus dem Talent-Catcher-Logo (Flugbahn-zu-Ziel-Motiv),
// freigestellt und mit verstärkten Fadenkreuz-Strichen für Lesbarkeit auf
// hellem Grund — Original-Mintfarbe beibehalten (Markenkonsistenz statt
// Umfärbung), siehe Chat-Verlauf. public/brand/logo-original.jpg ist das
// unbearbeitete Original.
export function LogoMark({
  height = 28,
  className = "",
}: {
  height?: number;
  className?: string;
}) {
  const width = Math.round((height * logoIcon.width) / logoIcon.height);
  return (
    <Image
      src={logoIcon}
      alt="Talent Catcher"
      height={height}
      width={width}
      className={`inline-block ${className}`}
      priority
    />
  );
}
