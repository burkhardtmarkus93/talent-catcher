import Stripe from "stripe";

// Lazy statt Modul-Top-Level instanziiert: ein fehlender/leerer
// STRIPE_SECRET_KEY soll nur die tatsächlich aufrufende Anfrage zur
// Laufzeit fehlschlagen lassen, nicht das gesamte Build (Next.js wertet
// Route-Module u. a. während "Collecting page data" aus).
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-07-29.dahlia",
    });
  }
  return _stripe;
}
