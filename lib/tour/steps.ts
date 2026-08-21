export type TourStepId =
  | "welcome"
  | "hero"
  | "urgent"
  | "watchlists-section"
  | "nav-talente"
  | "talents-filters"
  | "talent-detail"
  | "nav-candidates"
  | "nav-alerts"
  | "nav-watchlists"
  | "nav-import"
  | "nav-abo"
  | "nav-verwaltung"
  | "finish";

export interface TourStep {
  id: TourStepId;
  /** data-tour-id of the element to spotlight; omit for a centered slide. */
  targetId?: string;
  /** Route to navigate to before spotlighting targetId, if not already there. */
  path?: string;
  /** Only include this step for club admins — filtered server-side before reaching ProductTour. */
  adminOnly?: boolean;
}

// Titel/Text je Schritt liegen übersetzt in messages/*.json unter
// productTour.steps.<id> (title/body) — ProductTour.tsx löst sie anhand
// der id auf. Hier nur die sprachunabhängige Struktur/Navigation.
export const INTRO_TOUR_STEPS: TourStep[] = [
  { id: "welcome" },
  {
    id: "hero",
    targetId: "tour-dashboard-hero",
    path: "/dashboard",
  },
  {
    id: "urgent",
    targetId: "tour-dashboard-urgent",
    path: "/dashboard",
  },
  {
    id: "watchlists-section",
    targetId: "tour-dashboard-watchlists",
    path: "/dashboard",
  },
  {
    id: "nav-talente",
    targetId: "tour-nav-talente",
    path: "/talents",
  },
  {
    id: "talents-filters",
    targetId: "tour-talents-filters",
    path: "/talents",
  },
  { id: "talent-detail" },
  {
    id: "nav-candidates",
    targetId: "tour-nav-candidates",
    path: "/candidates",
  },
  {
    id: "nav-alerts",
    targetId: "tour-nav-alerts",
    path: "/alerts-reminders",
  },
  {
    id: "nav-watchlists",
    targetId: "tour-nav-watchlists",
    path: "/watchlists",
  },
  {
    id: "nav-import",
    targetId: "tour-nav-import",
    path: "/import",
  },
  {
    id: "nav-abo",
    targetId: "tour-nav-abo",
  },
  {
    id: "nav-verwaltung",
    targetId: "tour-nav-verwaltung",
    adminOnly: true,
  },
  { id: "finish" },
];
