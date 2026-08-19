"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
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
  const t = await getTranslations("billingActions");
  const plan = String(formData.get("plan") ?? "") as PlanKey;
  const billingInterval = String(
    formData.get("billingInterval") ?? "monatlich"
  ) as BillingInterval;

  const stripe = getStripe();
  const appUser = await getCurrentAppUser();

  if (!appUser?.clubId) {
    redirect(`/billing?error=${encodeURIComponent(t("noClubAssigned"))}`);
  }

  if (appUser.role !== "admin") {
    redirect(`/billing?error=${encodeURIComponent(t("onlyAdminCanManage"))}`);
  }

  const selectedPlan = PLANS[plan];
  if (!selectedPlan?.selfService) {
    redirect(`/billing?error=${encodeURIComponent(t("planNotSelfService"))}`);
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
      `/billing?error=${encodeURIComponent(t("priceNotSetUp"))}`
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
    redirect(`/billing?error=${encodeURIComponent(t("checkoutFailed"))}`);
  }

  redirect(session.url!);
}

export async function createBillingPortalSession() {
  const t = await getTranslations("billingActions");
  const appUser = await getCurrentAppUser();

  if (!appUser?.clubId || appUser.role !== "admin") {
    redirect(`/billing?error=${encodeURIComponent(t("notAuthorized"))}`);
  }

  const admin = createAdminClient();
  const { data: club } = await admin
    .from("clubs")
    .select("stripe_customer_id")
    .eq("id", appUser.clubId)
    .maybeSingle();

  if (!club?.stripe_customer_id) {
    redirect(`/billing?error=${encodeURIComponent(t("noActiveSubscription"))}`);
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: club!.stripe_customer_id,
    return_url: `${siteUrl}/billing`,
  });

  redirect(portalSession.url);
}
