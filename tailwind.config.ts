import type { Config } from "tailwindcss";

// Design-System "Scouting-Dossier": ruhig, seriös, datenorientiert.
// Bewusst kein warmes Creme/Terracotta-Duo und kein Neon-auf-Schwarz —
// stattdessen eine gedeckte, an ein Aktenblatt und den Rasen angelehnte Palette.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1A2421",       // Haupttext, fast schwarz mit grünem Unterton
        paper: "#F5F6F3",     // Seitenhintergrund, kühles Papierweiß
        surface: "#FFFFFF",   // Karten-/Tabellenflächen
        pitch: {
          DEFAULT: "#1F5F44", // Primärakzent: gedecktes Rasengrün
          dim: "#E7EEEA",     // heller Hover-/Hintergrundton
          dark: "#163F2E",
        },
        amber: "#C9922B",     // Ampel gelb, gedeckter Senfton statt Signalgelb
        brick: "#A13D2E",     // Ampel rot, gedeckter Ziegelton statt Signalrot
        line: "#DCDFD9",      // Trennlinien, Tabellen-Hairlines
        muted: "#6B7570",     // Sekundärtext
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
      },
    },
  },
  plugins: [],
};

export default config;
