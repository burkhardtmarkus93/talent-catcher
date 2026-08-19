// Zentrale Plan-Definition für Talent Catcher.
//
// Preisherleitung (Stand August 2026, siehe Chat-Verlauf für Quellen):
// Spezialisierte Scouting-Tools für den Amateurbereich liegen zwischen
// ca. 10€/Monat (Scout App) und 20-90€/Monat (Scout52); allgemeine
// Vereinssoftware zwischen 7€ und 80€/Monat je nach Funktionsumfang.
// Talent Catcher ist kein Vereinsverwaltungstool (Mitglieder/Buchhaltung),
// sondern ein spezialisiertes Scouting-Frühwarnsystem — daher näher an
// der Scouting-Nische als an allgemeiner Vereinssoftware positioniert.
// Profi-Tools wie Wyscout (20k+£/Jahr) sind kein relevanter Vergleich
// für die Zielgruppe Amateurverein/Scout.
//
// Scout-Zugänge im Verein-Plan bewusst auf 3 begrenzt (nicht 5): selbst
// professionelle NLZ sind bei dedizierten Scouting-Stellen oft knapper
// besetzt — 5 Zugänge für einen Amateurverein wäre am Markt vorbei.

import deMessages from "@/messages/de.json";

export type PlanKey = "start" | "verein" | "verband";
export type BillingInterval = "monatlich" | "jaehrlich";

export interface Plan {
  key: PlanKey;
  priceMonthly: number | null; // null = kein Selfservice-Preis (Verband/NLZ)
  priceYearly: number | null; // Gesamtpreis pro Jahr, nicht pro Monat
  maxScouts: number | null; // null = unbegrenzt
  maxActiveTalents: number | null; // null = unbegrenzt
  selfService: boolean;
}

// Name/Tagline/Features sind übersetzbarer UI-Text und liegen in
// messages/*.json (Namespace "plans"), nicht hier — siehe planNameDe()/
// planTaglineDe() unten für die wenigen Stellen außerhalb der UI
// (Stripe-Produktnamen, serverseitige Limit-Fehlermeldung), die bewusst
// immer die deutsche Fassung als feste Kennung verwenden.
export const PLANS: Record<PlanKey, Plan> = {
  start: {
    key: "start",
    priceMonthly: 19,
    priceYearly: 190, // entspricht ~15,83€/Monat, 2 Monate gratis
    maxScouts: 1,
    maxActiveTalents: 25,
    selfService: true,
  },
  verein: {
    key: "verein",
    priceMonthly: 49,
    priceYearly: 490, // entspricht ~40,83€/Monat, 2 Monate gratis
    maxScouts: 3,
    maxActiveTalents: null,
    selfService: true,
  },
  verband: {
    key: "verband",
    priceMonthly: null,
    priceYearly: null,
    maxScouts: null,
    maxActiveTalents: null,
    selfService: false,
  },
};

// Feste deutsche Kennung für Kontexte außerhalb der lokalisierten UI:
// Stripe-Produktnamen (lib/stripeSetup.ts) und die serverseitige
// Plan-Limit-Fehlermeldung (lib/actions/talents.ts) — beide bewusst
// nicht lokalisiert, siehe dortige Kommentare.
export function planNameDe(key: PlanKey): string {
  return deMessages.plans[key].name;
}

export function planTaglineDe(key: PlanKey): string {
  return deMessages.plans[key].tagline;
}

export function formatEuro(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

// Stripe-Price-Lookup-Keys. Statt Price-IDs irgendwo zu speichern/kopieren,
// werden Preise zur Laufzeit per lookup_key aufgelöst (stripe.prices.list)
// — lib/plans.ts bleibt so die einzige Quelle der Wahrheit für Preise.
export function stripeLookupKey(plan: PlanKey, billingInterval: BillingInterval): string {
  return `${plan}_${billingInterval === "monatlich" ? "monthly" : "yearly"}`;
}

export function planAndIntervalFromLookupKey(
  lookupKey: string
): { plan: PlanKey; billingInterval: BillingInterval } | null {
  const match = lookupKey.match(/^(start|verein|verband)_(monthly|yearly)$/);
  if (!match) return null;
  return {
    plan: match[1] as PlanKey,
    billingInterval: match[2] === "monthly" ? "monatlich" : "jaehrlich",
  };
}
