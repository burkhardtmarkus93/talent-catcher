"use server";

import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import {
  PLANS,
  stripeLookupKey,
  type PlanKey,
  type BillingInterval,
} from "@/lib/plans";

export async function createCheckoutSession(formData: FormData) {
  const plan = String(formData.get("plan") ?? "") as PlanKey;
  const billingInterval = String(
    formData.get("billingInterval") ?? "monatlich"
  ) as BillingInterval;

  const stripe = getStripe();
  const appUser = await getCurrentAppUser();

  if (!appUser?.clubId) {
    redirect("/billing?error=Kein%20Verein%20zugeordnet.");
  }

  if (appUser.role !== "admin") {
    redirect("/billing?error=Nur%20der%20Vereins-Admin%20kann%20das%20Abo%20verwalten.");
  }

  const selectedPlan = PLANS[plan];
  if (!selectedPlan?.selfService) {
    redirect("/billing?error=Dieser%20Plan%20ist%20nicht%20per%20Selfservice%20verf%C3%BCgbar.");
  }

  const lookupKey = stripeLookupKey(plan, billingInterval);
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  const price = prices.data[0];
  if (!price) {
    redirect(
      "/billing?error=Preis%20noch%20nicht%20eingerichtet.%20Bitte%20zuerst%20/api/admin/stripe-setup%20aufrufen."
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: price!.id, quantity: 1 }],
    customer_email: appUser.email,
    client_reference_id: appUser.clubId,
    payment_method_types: ["card", "paypal", "sepa_debit"],
    success_url: `${siteUrl}/billing?success=1`,
    cancel_url: `${siteUrl}/billing?canceled=1`,
    metadata: { club_id: appUser.clubId, plan, billing_interval: billingInterval },
  });

  if (!session.url) {
    redirect("/billing?error=Checkout%20konnte%20nicht%20gestartet%20werden.");
  }

  redirect(session.url!);
}

export async function createBillingPortalSession() {
  const appUser = await getCurrentAppUser();

  if (!appUser?.clubId || appUser.role !== "admin") {
    redirect("/billing?error=Nicht%20berechtigt.");
  }

  const admin = createAdminClient();
  const { data: club } = await admin
    .from("clubs")
    .select("stripe_customer_id")
    .eq("id", appUser.clubId)
    .maybeSingle();

  if (!club?.stripe_customer_id) {
    redirect("/billing?error=Noch%20kein%20aktives%20Abo%20gefunden.");
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: club!.stripe_customer_id,
    return_url: `${siteUrl}/billing`,
  });

  redirect(portalSession.url);
}
