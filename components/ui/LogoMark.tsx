// Bildmarke aus dem Talent-Catcher-Logo (Flugbahn zum Ziel), als sauberes
// SVG nachgebaut und auf die App-Akzentfarbe (Rasengrün) umgefärbt statt
// des Original-Neon-Mint-auf-Navy — passt so zur bestehenden "Scouting-
// Dossier"-Optik. currentColor, damit die Farbe vom Kontext geerbt wird.
export function LogoMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      role="img"
      aria-label="Talent Catcher Logo"
    >
      <path
        d="M26,66 Q30,22 65,31"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="26" cy="66" r="5" stroke="currentColor" strokeWidth="3.5" fill="none" />
      <circle cx="74" cy="32" r="12" stroke="currentColor" strokeWidth="3.5" fill="none" />
      <circle cx="74" cy="32" r="5.5" fill="currentColor" />
      <line x1="74" y1="10" x2="74" y2="16" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="74" y1="48" x2="74" y2="54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="52" y1="32" x2="58" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="90" y1="32" x2="96" y2="32" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
