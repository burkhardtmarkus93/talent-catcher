import "./globals.css";
import { Fraunces, Inter, IBM_Plex_Mono } from "next/font/google";

// tailwind.config.ts erwartet diese drei CSS-Variablen (--font-fraunces/
// -inter/-plex-mono) für das "Scouting-Dossier"-Design-System — bislang
// wurden sie nirgends definiert, wodurch jede Seite auf den Browser-
// Standardfont (Serif) zurückfiel.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`${fraunces.variable} ${inter.variable} ${plexMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
