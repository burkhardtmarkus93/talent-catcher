"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import { runStripeProductSetup } from "@/lib/stripeSetup";

// Vorher musste ein Admin die GET-Route /api/admin/stripe-setup manuell
// per Browser-URL oder curl aufrufen — kein Button, keine Dokumentation
// im UI. Ohne diesen Schritt bricht createCheckoutSession (lib/actions/
// billing.ts) mit "Preis noch nicht eingerichtet" ab. Dieselbe, bereits
// idempotente Logik (lib/stripeSetup.ts) jetzt zusätzlich über einen
// Button in der Verwaltung erreichbar.
export async function triggerStripeSetup(): Promise<void> {
  const t = await getTranslations("adminStripeActions");
  const appUser = await getCurrentAppUser();
  if (!appUser || appUser.role !== "admin") {
    redirect("/admin?error=" + encodeURIComponent(t("notAuthorized")));
  }

  let results;
  try {
    results = await runStripeProductSetup();
  } catch (error) {
    console.error("triggerStripeSetup() fehlgeschlagen:", error);
    redirect(
      "/admin?error=" + encodeURIComponent(t("setupFailed"))
    );
  }

  const summary = results.map((r) => `${r.lookupKey}: ${r.status}`).join(", ");
  redirect(
    "/admin?success=" +
      encodeURIComponent(t("setupComplete", { summary }))
  );
}
