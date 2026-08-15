export interface TourStep {
  id: string;
  title: string;
  body: string;
  /** data-tour-id of the element to spotlight; omit for a centered slide. */
  targetId?: string;
  /** Route to navigate to before spotlighting targetId, if not already there. */
  path?: string;
  /** Only include this step for club admins — filtered server-side before reaching ProductTour. */
  adminOnly?: boolean;
}

export const INTRO_TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Willkommen bei Talent Catcher",
    body: "Ein kurzer Rundgang durch die wichtigsten Bereiche — jederzeit unten links über \"Erste-Schritte-Tour\" erneut startbar.",
  },
  {
    id: "hero",
    title: "Handlungsbedarf auf einen Blick",
    body: "Hier siehst du sofort, ob und wie viele Talente gerade Aufmerksamkeit brauchen — automatisch berechnet von der Risk-Engine.",
    targetId: "tour-dashboard-hero",
    path: "/dashboard",
  },
  {
    id: "urgent",
    title: "Dringendster Handlungsbedarf",
    body: "Die Talente mit dem höchsten Risiko stehen hier oben, inklusive Ampel-Status und Begründung.",
    targetId: "tour-dashboard-urgent",
    path: "/dashboard",
  },
  {
    id: "watchlists-section",
    title: "Meine Watchlists",
    body: "Eigene Talent-Gruppierungen, z. B. für einen bestimmten Sichtungstag oder eine Altersklasse.",
    targetId: "tour-dashboard-watchlists",
    path: "/dashboard",
  },
  {
    id: "nav-talente",
    title: "Talente",
    body: "Die vollständige Talentliste mit Filtern nach Position, Status und Ampel — hier legst du auch neue Talente an.",
    targetId: "tour-nav-talente",
    path: "/talents",
  },
  {
    id: "nav-alerts",
    title: "Alerts & Wiedervorlagen",
    body: "Alle offenen Handlungsaufforderungen an einem Ort — automatische Alerts und von dir gesetzte Wiedervorlagen.",
    targetId: "tour-nav-alerts",
    path: "/alerts-reminders",
  },
  {
    id: "nav-watchlists",
    title: "Watchlists",
    body: "Übersicht über alle deine Watchlists mit Talentanzahl.",
    targetId: "tour-nav-watchlists",
    path: "/watchlists",
  },
  {
    id: "nav-import",
    title: "Import",
    body: "Bestehende Scouting-Listen per CSV oder XLSX übernehmen, inklusive Spalten-Zuordnung.",
    targetId: "tour-nav-import",
    path: "/import",
  },
  {
    id: "nav-abo",
    title: "Abo",
    body: "Dein aktueller Plan und deine Testphase — nach der kostenlosen Testphase wählst du hier ein Abo.",
    targetId: "tour-nav-abo",
  },
  {
    id: "nav-verwaltung",
    title: "Verwaltung",
    body: "Vereinsname bearbeiten, Teammitglieder verwalten (Rolle, Jugendschutz-Zugriff, deaktivieren) und neue Scouts per E-Mail einladen.",
    targetId: "tour-nav-verwaltung",
    adminOnly: true,
  },
  {
    id: "finish",
    title: "Bereit zum Loslegen",
    body: "Das war's! Du kannst die Tour jederzeit über \"Erste-Schritte-Tour\" unten links in der Sidebar erneut starten.",
  },
];
