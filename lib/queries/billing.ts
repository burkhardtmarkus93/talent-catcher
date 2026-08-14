import { createClient } from "@/lib/supabase/server";

export interface ClubBilling {
  plan: "start" | "verein" | "verband";
  billingInterval: "monatlich" | "jaehrlich";
  subscriptionStatus: string | null;
  hasStripeCustomer: boolean;
}

export async function getClubBilling(clubId: string): Promise<ClubBilling | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("plan, billing_interval, subscription_status, stripe_customer_id")
    .eq("id", clubId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    plan: data.plan,
    billingInterval: data.billing_interval,
    subscriptionStatus: data.subscription_status,
    hasStripeCustomer: Boolean(data.stripe_customer_id),
  };
}
