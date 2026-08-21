import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { planAndIntervalFromLookupKey } from "@/lib/plans";
import { inviteCandidateGuardian } from "@/lib/candidateGuardianAccess";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Fehlende Signatur." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Stripe-Webhook: Signaturprüfung fehlgeschlagen:", err);
    return NextResponse.json({ error: "Ungültige Signatur." }, { status: 400 });
  }

  const admin = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Einmalige Kandidaten-Registrierungsgebühr (Eltern-initiierte
      // Anmeldung eines minderjährigen Spielers, siehe Migration
      // 20260821120000) — eigener Zweig, unterscheidbar am
      // "payment"-statt-"subscription"-Modus, da beide Checkout-Arten
      // über denselben Event-Typ laufen.
      if (session.mode === "payment") {
        const candidateId = session.client_reference_id;
        if (!candidateId) {
          console.error(
            "Stripe-Webhook: checkout.session.completed (payment) ohne client_reference_id",
            session.id
          );
          break;
        }

        const { data: candidate, error: fetchError } = await admin
          .from("talent_candidates")
          .select("id, status, guardian_email")
          .eq("id", candidateId)
          .maybeSingle();

        if (fetchError || !candidate) {
          console.error(
            "Stripe-Webhook: Kandidatur nicht gefunden (checkout.session.completed/payment)",
            candidateId,
            fetchError?.message
          );
          break;
        }

        // Idempotenz: Stripe kann Webhook-Events mehrfach zustellen —
        // ein bereits verarbeitetes Event (Status nicht mehr
        // 'pending_payment') soll nicht erneut die Guardian-Einladung
        // auslösen.
        if (candidate.status !== "pending_payment") {
          break;
        }

        const { error: updateError } = await admin
          .from("talent_candidates")
          .update({
            status: "pending_review",
            paid_at: new Date().toISOString(),
            amount_paid_cents: session.amount_total,
            stripe_checkout_session_id: session.id,
          })
          .eq("id", candidateId);

        if (updateError) {
          console.error(
            "Stripe-Webhook: talent_candidates-Update (checkout.session.completed/payment) fehlgeschlagen:",
            updateError.message
          );
          break;
        }

        if (candidate.guardian_email) {
          await inviteCandidateGuardian(candidate.guardian_email);
        }

        break;
      }

      const clubId = session.client_reference_id;

      if (!clubId || typeof session.customer !== "string" || typeof session.subscription !== "string") {
        console.error("Stripe-Webhook: checkout.session.completed ohne club_id/customer/subscription", session.id);
        break;
      }

      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const lookupKey = subscription.items.data[0]?.price?.lookup_key;
      const resolved = lookupKey ? planAndIntervalFromLookupKey(lookupKey) : null;

      const { error } = await admin
        .from("clubs")
        .update({
          stripe_customer_id: session.customer,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          ...(resolved
            ? { plan: resolved.plan, billing_interval: resolved.billingInterval }
            : {}),
        })
        .eq("id", clubId);

      if (error) {
        console.error("Stripe-Webhook: clubs-Update (checkout.session.completed) fehlgeschlagen:", error);
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const lookupKey = subscription.items.data[0]?.price?.lookup_key;
      const resolved = lookupKey ? planAndIntervalFromLookupKey(lookupKey) : null;

      const { error } = await admin
        .from("clubs")
        .update({
          subscription_status:
            event.type === "customer.subscription.deleted" ? "canceled" : subscription.status,
          ...(resolved
            ? { plan: resolved.plan, billing_interval: resolved.billingInterval }
            : {}),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (error) {
        console.error(`Stripe-Webhook: clubs-Update (${event.type}) fehlgeschlagen:`, error);
      }
      break;
    }

    default:
      // Andere Event-Typen sind für uns aktuell nicht relevant.
      break;
  }

  return NextResponse.json({ received: true });
}
