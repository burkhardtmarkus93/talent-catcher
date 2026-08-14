import type { Config } from "tailwindcss";

// Design-System "Scouting-Dossier": datenorientiert, aber an die
// Mint-Akzentfarbe der Bildmarke angeglichen statt einem eigenständigen,
// unverwandten Waldgrün. Ampelfarben als Soft-Tint-Paar (kräftiger Text-
// /Icon-Ton + heller Hintergrund-Ton), wie bei modernen SaaS-Dashboards
// üblich — siehe Design-Vorschlag "Talent Catcher Neugestaltung".
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
          DEFAULT: "#0D9488", // Primärakzent: an das Logo-Mint angeglichenes Teal
          dark: "#0B7A70",    // Hover-/Pressed-Ton
          dim: "#E3F7F4",     // heller Soft-Tint-Hintergrund (Badges, Hover)
          bright: "#2DD4BF",  // sparsam: Icon-Chips/Highlights, nah am Logo-Mint
        },
        amber: {
          DEFAULT: "#D98C1B", // Ampel gelb
          dark: "#B8791A",    // Text auf amber-dim
          dim: "#FDF1DE",     // heller Soft-Tint-Hintergrund
        },
        brick: {
          DEFAULT: "#C1402B", // Ampel rot
          dim: "#FCEAE6",     // heller Soft-Tint-Hintergrund
        },
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
