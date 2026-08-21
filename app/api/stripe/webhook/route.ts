import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";
import { planAndIntervalFromLookupKey } from "@/lib/plans";
import { invitePortalAccess } from "@/lib/candidateGuardianAccess";

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

      // Einmalige Bewerbungs-/Bearbeitungsgebühr (siehe Migration
      // 20260821120000/20260821130000/20260821140000) — eigener Zweig,
      // unterscheidbar am "payment"-statt-"subscription"-Modus, da beide
      // Checkout-Arten über denselben Event-Typ laufen. metadata.type
      // unterscheidet zusätzlich zwischen einer neuen Kandidatur
      // (talent_candidates) und einem Selbstverwaltungs-Zugang zu einem
      // bereits bestehenden Talent (talent_edit_access_requests).
      if (session.mode === "payment") {
        const recordId = session.client_reference_id;
        const paymentType = session.metadata?.type;

        if (!recordId) {
          console.error(
            "Stripe-Webhook: checkout.session.completed (payment) ohne client_reference_id",
            session.id
          );
          break;
        }

        if (paymentType === "edit_access") {
          const { data: request_, error: fetchError } = await admin
            .from("talent_edit_access_requests")
            .select("id, talent_id, status, requester_email, guardian_email, is_minor")
            .eq("id", recordId)
            .maybeSingle();

          if (fetchError || !request_) {
            console.error(
              "Stripe-Webhook: Edit-Access-Anfrage nicht gefunden (checkout.session.completed/payment)",
              recordId,
              fetchError?.message
            );
            break;
          }

          // Idempotenz: siehe Kommentar im talent_candidates-Zweig unten.
          if (request_.status !== "pending_payment") {
            break;
          }

          const { error: updateError } = await admin
            .from("talent_edit_access_requests")
            .update({
              status: "paid",
              paid_at: new Date().toISOString(),
              amount_paid_cents: session.amount_total,
              stripe_checkout_session_id: session.id,
            })
            .eq("id", recordId);

          if (updateError) {
            console.error(
              "Stripe-Webhook: talent_edit_access_requests-Update fehlgeschlagen:",
              updateError.message
            );
            break;
          }

          const grantEmail = request_.is_minor ? request_.guardian_email : request_.requester_email;
          if (!grantEmail) {
            console.error(
              "Stripe-Webhook: Edit-Access-Anfrage ohne Zugriffs-E-Mail",
              recordId
            );
            break;
          }

          // Verknüpfung wird bewusst unclaimed angelegt (user_id/claimed_at
          // null) — erst confirm_deferred_access_links() nach echter
          // Bestätigung des Einladungs-Links füllt sie, gleiches Prinzip
          // wie bei der Kandidaten-Guardian-Einladung unten.
          const { error: linkError } = await admin.from("talent_guardians").insert({
            talent_id: request_.talent_id,
            email: grantEmail,
            relationship: request_.is_minor ? "guardian" : "self",
          });

          if (linkError) {
            console.error(
              "Stripe-Webhook: talent_guardians-Verknüpfung (Edit-Access) fehlgeschlagen:",
              linkError.message
            );
          }

          await invitePortalAccess(grantEmail, request_.is_minor ? "candidate_guardian" : "player");
          break;
        }

        const { data: candidate, error: fetchError } = await admin
          .from("talent_candidates")
          .select("id, status, guardian_email")
          .eq("id", recordId)
          .maybeSingle();

        if (fetchError || !candidate) {
          console.error(
            "Stripe-Webhook: Kandidatur nicht gefunden (checkout.session.completed/payment)",
            recordId,
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
          .eq("id", recordId);

        if (updateError) {
          console.error(
            "Stripe-Webhook: talent_candidates-Update (checkout.session.completed/payment) fehlgeschlagen:",
            updateError.message
          );
          break;
        }

        if (candidate.guardian_email) {
          await invitePortalAccess(candidate.guardian_email, "candidate_guardian");
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
