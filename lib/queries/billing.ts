import { createClient } from "@/lib/supabase/server";

export interface ClubBilling {
  plan: "start" | "verein" | "verband";
  billingInterval: "monatlich" | "jaehrlich";
  subscriptionStatus: string | null;
  hasStripeCustomer: boolean;
  trialEndsAt: string;
}

export async function getClubBilling(clubId: string): Promise<ClubBilling | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("plan, billing_interval, subscription_status, stripe_customer_id, trial_ends_at")
    .eq("id", clubId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    plan: data.plan,
    billingInterval: data.billing_interval,
    subscriptionStatus: data.subscription_status,
    hasStripeCustomer: Boolean(data.stripe_customer_id),
    trialEndsAt: data.trial_ends_at,
  };
}

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing"]);

// Zugriff besteht, solange entweder ein aktives (Stripe-)Abo vorliegt
// ODER die kostenlose 3-Tage-Testphase (clubs.trial_ends_at) noch läuft.
export function hasActiveAccess(
  billing: Pick<ClubBilling, "subscriptionStatus" | "trialEndsAt">
): boolean {
  if (
    billing.subscriptionStatus &&
    ACTIVE_SUBSCRIPTION_STATUSES.has(billing.subscriptionStatus)
  ) {
    return true;
  }
  return new Date(billing.trialEndsAt).getTime() > Date.now();
}

export function trialDaysRemaining(trialEndsAt: string): number {
  const msRemaining = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
}
