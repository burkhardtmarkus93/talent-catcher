"use server";

import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/queries/session";
import { runStripeProductSetup } from "@/lib/stripeSetup";

// Vorher musste ein Admin die GET-Route /api/admin/stripe-setup manuell
// per Browser-URL oder curl aufrufen — kein Button, keine Dokumentation
// im UI. Ohne diesen Schritt bricht createCheckoutSession (lib/actions/
// billing.ts) mit "Preis noch nicht eingerichtet" ab. Dieselbe, bereits
// idempotente Logik (lib/stripeSetup.ts) jetzt zusätzlich über einen
// Button in der Verwaltung erreichbar.
export async function triggerStripeSetup(): Promise<void> {
  const appUser = await getCurrentAppUser();
  if (!appUser || appUser.role !== "admin") {
    redirect("/admin?error=" + encodeURIComponent("Nicht berechtigt."));
  }

  let results;
  try {
    results = await runStripeProductSetup();
  } catch (error) {
    console.error("triggerStripeSetup() fehlgeschlagen:", error);
    redirect(
      "/admin?error=" + encodeURIComponent("Stripe-Einrichtung fehlgeschlagen.")
    );
  }

  const summary = results.map((r) => `${r.lookupKey}: ${r.status}`).join(", ");
  redirect(
    "/admin?success=" +
      encodeURIComponent(`Stripe-Einrichtung abgeschlossen — ${summary}`)
  );
}
