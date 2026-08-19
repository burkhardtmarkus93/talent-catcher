import { getStripe } from "@/lib/stripe";
import {
  PLANS,
  stripeLookupKey,
  planNameDe,
  planTaglineDe,
  type PlanKey,
  type BillingInterval,
} from "@/lib/plans";

// Einmalige, admin-geschützte Einrichtung: legt für jeden Selfservice-Plan
// ein Stripe-Produkt mit einem monatlichen und einem jährlichen Preis an
// (idempotent über lookup_key — mehrfacher Aufruf legt nichts doppelt an).
// lib/plans.ts bleibt dabei die einzige Quelle der Wahrheit für Preise.
//
// Aus app/api/admin/stripe-setup/route.ts (GET-Route, bleibt als
// direkter Aufrufweg bestehen) und lib/actions/billing.ts::
// triggerStripeSetup (Button in der Verwaltung) herausgezogen, damit
// beide dieselbe Logik teilen statt sie zu duplizieren.
export interface StripeSetupResult {
  lookupKey: string;
  status: "erstellt" | "vorhanden";
  priceId: string;
}

export async function runStripeProductSetup(): Promise<StripeSetupResult[]> {
  const stripe = getStripe();
  const results: StripeSetupResult[] = [];

  for (const plan of Object.values(PLANS)) {
    if (!plan.selfService || plan.priceMonthly === null || plan.priceYearly === null) {
      continue;
    }

    const product = await getOrCreateProduct(plan.key, planNameDe(plan.key), planTaglineDe(plan.key));

    for (const billingInterval of ["monatlich", "jaehrlich"] as BillingInterval[]) {
      const lookupKey = stripeLookupKey(plan.key, billingInterval);
      const amount = billingInterval === "monatlich" ? plan.priceMonthly : plan.priceYearly;
      const interval = billingInterval === "monatlich" ? "month" : "year";

      const existing = await stripe.prices.list({
        lookup_keys: [lookupKey],
        active: true,
        limit: 1,
      });

      if (existing.data.length > 0) {
        results.push({ lookupKey, status: "vorhanden", priceId: existing.data[0].id });
        continue;
      }

      const price = await stripe.prices.create({
        product: product.id,
        currency: "eur",
        unit_amount: amount * 100,
        recurring: { interval },
        lookup_key: lookupKey,
        nickname: `${planNameDe(plan.key)} (${billingInterval})`,
      });

      results.push({ lookupKey, status: "erstellt", priceId: price.id });
    }
  }

  return results;
}

async function getOrCreateProduct(key: PlanKey, name: string, description: string) {
  const stripe = getStripe();
  const existing = await stripe.products.search({
    query: `metadata['plan_key']:'${key}' AND active:'true'`,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0];
  }

  return stripe.products.create({
    name: `Talent Catcher — ${name}`,
    description,
    metadata: { plan_key: key },
  });
}
