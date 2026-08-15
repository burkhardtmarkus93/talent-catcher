"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

// Erteilt eine Einwilligung, indem eine NEUE Zeile mit status='erteilt'
// angelegt wird (consent_records hat laut RLS nur SELECT/INSERT, kein
// UPDATE — siehe consent_records_insert_youth_access,
// 20260722213000_rls_extended.sql). hasGrantedVideoConsent()
// (lib/queries/consent.ts) sucht ohnehin die jüngste 'erteilt'-Zeile,
// eine frühere 'angefragt'-Zeile bleibt als Historie unangetastet stehen.
export async function grantVideoConsent(formData: FormData): Promise<void> {
  const talentId = String(formData.get("talentId") ?? "");
  const confirmed = formData.get("confirmed") === "on";
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const validUntil = String(formData.get("validUntil") ?? "").trim() || null;

  if (!talentId) {
    throw new Error("Talent-ID fehlt.");
  }
  if (!confirmed) {
    throw new Error(
      "Bitte bestätige, dass eine wirksame Einwilligung der/des Erziehungsberechtigten vorliegt."
    );
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId || !appUser.hasYouthAccess) {
    throw new Error(
      "Dafür ist die Berechtigung „Zugriff auf Jugendtalente“ erforderlich."
    );
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
    throw new Error("Einwilligung konnte nicht gespeichert werden.");
  }

  revalidatePath(`/talents/${talentId}`);
}
