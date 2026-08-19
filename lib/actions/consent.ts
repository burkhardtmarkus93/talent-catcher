"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

// Erteilt eine Einwilligung, indem eine NEUE Zeile mit status='erteilt'
// angelegt wird (consent_records hat laut RLS nur SELECT/INSERT, kein
// UPDATE — siehe consent_records_insert_youth_access,
// 20260722213000_rls_extended.sql). hasGrantedVideoConsent()
// (lib/queries/consent.ts) sucht ohnehin die jüngste 'erteilt'-Zeile,
// eine frühere 'angefragt'-Zeile bleibt als Historie unangetastet stehen.
export async function grantVideoConsent(formData: FormData): Promise<void> {
  const t = await getTranslations("consentActions");
  const talentId = String(formData.get("talentId") ?? "");
  const confirmed = formData.get("confirmed") === "on";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const validUntil = String(formData.get("validUntil") ?? "").trim() || null;

  if (!talentId) {
    throw new Error(t("talentIdMissing"));
  }
  if (!confirmed) {
    throw new Error(t("confirmRequired"));
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId || !appUser.hasYouthAccess) {
    throw new Error(t("youthAccessRequired"));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("consent_records").insert({
    talent_id: talentId,
    scope: "video_material",
    status: "erteilt",
    granted_at: new Date().toISOString(),
    valid_until: validUntil,
    recorded_by: appUser.id,
    notes,
  });

  if (error) {
    console.error("grantVideoConsent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("saveFailed"));
  }

  revalidatePath(`/talents/${talentId}`);
}
