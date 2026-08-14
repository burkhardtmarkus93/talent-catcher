"use client";

import { useState } from "react";
import { PLANS, formatEuro, type PlanKey, type BillingInterval } from "@/lib/plans";

const SELF_SERVICE_PLANS: PlanKey[] = ["start", "verein"];

export function PlanSelector() {
  const [plan, setPlan] = useState<PlanKey>("start");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monatlich");

  return (
    <div>
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="billingInterval" value={billingInterval} />

      <div className="mb-4 flex items-center justify-center gap-3">
        <span
          className={`text-sm ${billingInterval === "monatlich" ? "text-ink" : "text-muted"}`}
        >
          Monatlich
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={billingInterval === "jaehrlich"}
          onClick={() =>
            setBillingInterval((prev) =>
              prev === "monatlich" ? "jaehrlich" : "monatlich"
            )
          }
          className="relative h-6 w-11 flex-none rounded-full border border-line bg-paper transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-pitch"
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-pitch transition-transform ${
              billingInterval === "jaehrlich" ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span
          className={`text-sm ${billingInterval === "jaehrlich" ? "text-ink" : "text-muted"}`}
        >
          Jährlich <span className="text-pitch">— 2 Monate gratis</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {SELF_SERVICE_PLANS.map((key) => {
          const p = PLANS[key];
          const selected = plan === key;
          const displayPrice =
            billingInterval === "monatlich"
              ? p.priceMonthly
              : p.priceYearly !== null
                ? p.priceYearly / 12
                : null;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setPlan(key)}
              aria-pressed={selected}
              className={`flex flex-col items-start gap-2 rounded-md border p-4 text-left transition-colors ${
                selected
                  ? "border-pitch bg-pitch-dim"
                  : "border-line bg-surface hover:border-pitch/50"
              }`}
            >
              <span className="font-display text-base font-medium text-ink">{p.name}</span>
              <span className="text-xs text-muted">{p.tagline}</span>
              <span className="mt-1 font-mono text-xl text-ink">
                {displayPrice !== null ? formatEuro(displayPrice) : "—"}
                <span className="text-xs font-sans text-muted"> / Monat</span>
              </span>
              {billingInterval === "jaehrlich" && p.priceYearly !== null && (
                <span className="text-xs text-muted">
                  {formatEuro(p.priceYearly)} pro Jahr abgerechnet
                </span>
              )}
              <ul className="mt-1 flex flex-col gap-1 text-xs text-muted">
                {p.features.map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </button>
          );
        })}

        <div className="flex flex-col items-start gap-2 rounded-md border border-dashed border-line bg-paper p-4 text-left">
          <span className="font-display text-base font-medium text-ink">
            {PLANS.verband.name}
          </span>
          <span className="text-xs text-muted">{PLANS.verband.tagline}</span>
          <span className="mt-1 text-sm text-ink">Preis auf Anfrage</span>
          <ul className="mt-1 flex flex-col gap-1 text-xs text-muted">
            {PLANS.verband.features.map((f) => (
              <li key={f}>· {f}</li>
            ))}
          </ul>
          <a
            href="mailto:burkhardt.markus93@gmail.com?subject=Verband%2FNLZ-Anfrage%20Talent%20Catcher"
            className="mt-1 text-xs text-pitch underline-offset-2 hover:underline"
          >
            Vertrieb kontaktieren →
          </a>
        </div>
      </div>
    </div>
  );
}
