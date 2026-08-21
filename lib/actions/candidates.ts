"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";
import { getActiveTalentCount } from "@/lib/queries/talents";
import { getStripe } from "@/lib/stripe";
import { CANDIDATE_REGISTRATION_LOOKUP_KEY } from "@/lib/candidatePricing";
import { PLANS, planNameDe } from "@/lib/plans";

export interface CandidateActionState {
  success: boolean;
  error?: string;
}

function calculateAge(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// Öffentliches Formular, kein Login nötig — siehe
// talent_candidates_insert_public (Migration 20260821100000).
//
// Zwei getrennte Abläufe je nach Alter (siehe Migration
// 20260821120000): Volljährige registrieren sich weiterhin direkt und
// kostenlos selbst. Minderjährige NICHT mehr selbst — hier trägt eine/n
// Erziehungsberechtigte/n die eigenen Kontaktdaten ein (contactEmail
// wird dabei zu guardian_email) und wird zu einer einmaligen Zahlung
// (Stripe Checkout, mode "payment") weitergeleitet. Die Kandidatur wird
// für den Verein erst nach bestätigter Zahlung sichtbar — siehe
// app/api/stripe/webhook/route.ts, das den Status von 'pending_payment'
// auf 'pending_review' hebt und danach den Eltern-Portal-Zugang einlädt
// (lib/candidateGuardianAccess.ts).
export async function submitTalentCandidate(
  _prevState: CandidateActionState,
  formData: FormData
): Promise<CandidateActionState> {
  const t = await getTranslations("candidateActions");

  const clubId = String(formData.get("clubId") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "");
  const primaryPosition = String(formData.get("primaryPosition") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim().toLowerCase();
  const consentGiven = formData.get("dataConsent") === "on";

  if (!clubId || !firstName || !lastName || !birthDate || !primaryPosition || !contactEmail) {
    return { success: false, error: t("requiredFields") };
  }

  const birthDateObj = new Date(birthDate);
  if (Number.isNaN(birthDateObj.getTime()) || birthDateObj.getTime() > Date.now()) {
    return { success: false, error: t("invalidBirthDate") };
  }

  if (!consentGiven) {
    return { success: false, error: t("consentRequired") };
  }

  const isMinor = calculateAge(birthDate) < 18;

  // id selbst erzeugen statt per .select() zurückzulesen: die
  // SELECT-Policy talent_candidates_select_same_club gilt nur für
  // "authenticated" (Scouts/Admins), eine öffentliche, nicht
  // angemeldete Registrierung hat also gar keine Policy, die die
  // eingefügte Zeile zurückgeben könnte — .select() würde hier mit
  // einem RLS-Fehler scheitern, obwohl der Insert selbst erlaubt ist.
  // Für den Minderjährigen-Ablauf brauchen wir die id trotzdem sofort
  // (client_reference_id für Stripe), daher explizit vorgeben.
  const candidateId = randomUUID();

  const supabase = await createClient();
  const { error: insertError } = await supabase.from("talent_candidates").insert({
    id: candidateId,
    club_id: clubId,
    first_name: firstName,
    last_name: lastName,
    birth_date: birthDate,
    primary_position: primaryPosition,
    contact_email: contactEmail,
    guardian_email: isMinor ? contactEmail : null,
  });

  if (insertError) {
    console.error("submitTalentCandidate() fehlgeschlagen (Insert):", {
      message: insertError.message,
      code: insertError.code,
      details: insertError.details,
      hint: insertError.hint,
    });
    return { success: false, error: t("submitFailed") };
  }

  if (!isMinor) {
    return { success: true };
  }

  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const prices = await stripe.prices.list({
    lookup_keys: [CANDIDATE_REGISTRATION_LOOKUP_KEY],
    active: true,
    limit: 1,
  });
  const price = prices.data[0];

  if (!price) {
    console.error(
      "submitTalentCandidate(): Stripe-Preis für Kandidaten-Registrierung nicht eingerichtet."
    );
    await createAdminClient().from("talent_candidates").delete().eq("id", candidateId);
    return { success: false, error: t("paymentNotSetUp") };
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: price.id, quantity: 1 }],
    customer_email: contactEmail,
    client_reference_id: candidateId,
    payment_method_types: ["card", "paypal", "sepa_debit"],
    success_url: `${siteUrl}/player-registration?paid=1`,
    cancel_url: `${siteUrl}/player-registration?canceled=1`,
    metadata: { candidate_id: candidateId },
  });

  if (!session.url) {
    console.error("submitTalentCandidate(): Stripe-Checkout-Session ohne url.");
    await createAdminClient().from("talent_candidates").delete().eq("id", candidateId);
    return { success: false, error: t("paymentSetupFailed") };
  }

  redirect(session.url);
}

async function requireClubReviewer() {
  const t = await getTranslations("candidateActions");
  const appUser = await getCurrentAppUser();
  if (!appUser) {
    redirect("/login");
  }
  if (!appUser.clubId) {
    redirect("/candidates?error=" + encodeURIComponent(t("noClubAssigned")));
  }
  return appUser;
}

// Annehmen: legt ein reguläres Talent an (gleiche Regeln wie die manuelle
// Anlage über createTalent — Plan-Limit, Jugendschutz-Berechtigung bei
// Minderjährigen) und verknüpft bei bereits bestätigter
// Erziehungsberechtigten-Einwilligung sofort einen fertig verifizierten
// Eltern-Zugang (talent_guardians), ohne eine zweite, separate Einladung
// zu benötigen.
export async function acceptTalentCandidate(formData: FormData): Promise<void> {
  const t = await getTranslations("candidateActions");
  const candidateId = String(formData.get("candidateId") ?? "");
  if (!candidateId) {
    redirect("/candidates?error=" + encodeURIComponent(t("candidateIdMissing")));
  }

  const appUser = await requireClubReviewer();
  const supabase = await createClient();

  const { data: candidate, error: candidateError } = await supabase
    .from("talent_candidates")
    .select("*")
    .eq("id", candidateId)
    .eq("status", "pending_review")
    .maybeSingle();

  if (candidateError || !candidate) {
    redirect("/candidates?error=" + encodeURIComponent(t("candidateNotFound")));
  }

  if (candidate.is_minor && !appUser.hasYouthAccess) {
    redirect("/candidates?error=" + encodeURIComponent(t("youthAccessRequired")));
  }

  const planLimit = appUser.clubPlan ? PLANS[appUser.clubPlan]?.maxActiveTalents : null;
  if (planLimit !== null && planLimit !== undefined) {
    const activeCount = await getActiveTalentCount(appUser.clubId!);
    if (activeCount >= planLimit) {
      redirect(
        "/candidates?error=" +
          encodeURIComponent(
            t("planLimitReached", { plan: planNameDe(appUser.clubPlan!), limit: planLimit })
          )
      );
    }
  }

  const { data: newTalent, error: talentError } = await supabase
    .from("talents")
    .insert({
      club_id: appUser.clubId,
      created_by: appUser.id,
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      birth_date: candidate.birth_date,
      primary_position: candidate.primary_position,
    })
    .select("id, is_minor")
    .single();

  if (talentError || !newTalent) {
    console.error("acceptTalentCandidate() fehlgeschlagen (Talent-Anlage):", {
      message: talentError?.message,
      code: talentError?.code,
      details: talentError?.details,
      hint: talentError?.hint,
    });
    redirect("/candidates?error=" + encodeURIComponent(t("acceptFailed")));
  }

  if (newTalent.is_minor) {
    const { error: consentError } = await supabase.from("consent_records").insert({
      talent_id: newTalent.id,
      scope: "profil_sichtbarkeit",
      status: "angefragt",
      requested_at: new Date().toISOString(),
      recorded_by: appUser.id,
    });
    if (consentError) {
      console.error(
        "acceptTalentCandidate(): Consent-Platzhalter fehlgeschlagen:",
        consentError.message
      );
    }

    if (candidate.guardian_user_id) {
      const { error: guardianLinkError } = await supabase.from("talent_guardians").insert({
        talent_id: newTalent.id,
        email: candidate.guardian_email,
        user_id: candidate.guardian_user_id,
        invited_by: appUser.id,
        claimed_at: new Date().toISOString(),
      });
      if (guardianLinkError) {
        console.error(
          "acceptTalentCandidate(): Eltern-Verknüpfung fehlgeschlagen:",
          guardianLinkError.message
        );
      }
    }
  }

  const { error: updateError } = await supabase
    .from("talent_candidates")
    .update({
      status: "accepted",
      reviewed_by: appUser.id,
      reviewed_at: new Date().toISOString(),
      resulting_talent_id: newTalent.id,
    })
    .eq("id", candidateId);

  if (updateError) {
    console.error(
      "acceptTalentCandidate() fehlgeschlagen (Status-Update):",
      updateError.message
    );
  }

  revalidatePath("/candidates");
  redirect(`/talents/${newTalent.id}`);
}

export async function declineTalentCandidate(formData: FormData): Promise<void> {
  const t = await getTranslations("candidateActions");
  const candidateId = String(formData.get("candidateId") ?? "");
  if (!candidateId) {
    redirect("/candidates?error=" + encodeURIComponent(t("candidateIdMissing")));
  }

  const appUser = await requireClubReviewer();
  const supabase = await createClient();

  const { error } = await supabase
    .from("talent_candidates")
    .update({
      status: "declined",
      reviewed_by: appUser.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", candidateId)
    .eq("status", "pending_review");

  if (error) {
    console.error("declineTalentCandidate() fehlgeschlagen:", error.message);
    redirect("/candidates?error=" + encodeURIComponent(t("declineFailed")));
  }

  revalidatePath("/candidates");
}
