"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export interface ClubReferralActionState {
  success: boolean;
  error?: string;
}

// Öffentliches Formular, kein Login nötig — siehe club_referrals_insert_public
// (Migration 20260821140000). Bewusst reine Ablage ohne automatischen
// Versand an den vorgeschlagenen Verein (mit dem Projektverantwortlichen
// abgestimmt: kein Spam-/Vertrauensrisiko, außerdem fehlt dafür noch ein
// echter Transaktions-E-Mail-Dienst) — die Einträge werden manuell über
// Supabase eingesehen und nachverfolgt.
export async function submitClubReferral(
  _prevState: ClubReferralActionState,
  formData: FormData
): Promise<ClubReferralActionState> {
  const t = await getTranslations("clubReferralActions");

  const referredClubName = String(formData.get("referredClubName") ?? "").trim();
  const referredClubContactEmail =
    String(formData.get("referredClubContactEmail") ?? "").trim().toLowerCase() || null;
  const referrerName = String(formData.get("referrerName") ?? "").trim();
  const referrerEmail = String(formData.get("referrerEmail") ?? "").trim().toLowerCase();
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!referredClubName || !referrerName || !referrerEmail) {
    return { success: false, error: t("requiredFields") };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("club_referrals").insert({
    referred_club_name: referredClubName,
    referred_club_contact_email: referredClubContactEmail,
    referrer_name: referrerName,
    referrer_email: referrerEmail,
    note,
  });

  if (error) {
    console.error("submitClubReferral() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    return { success: false, error: t("submitFailed") };
  }

  return { success: true };
}
