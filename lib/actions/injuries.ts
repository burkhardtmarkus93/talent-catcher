"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

export async function addInjury(formData: FormData): Promise<void> {
  const t = await getTranslations("injuryActions");
  const talentId = String(formData.get("talentId") ?? "");
  const injuryType = String(formData.get("injuryType") ?? "").trim();
  const injuryDate = String(formData.get("injuryDate") ?? "").trim();
  const expectedReturnDate =
    String(formData.get("expectedReturnDate") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!talentId) {
    throw new Error(t("talentIdMissing"));
  }
  if (!injuryType || !injuryDate) {
    throw new Error(t("typeAndDateRequired"));
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error(t("notAuthenticated"));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("talent_injuries").insert({
    talent_id: talentId,
    injury_type: injuryType,
    injury_date: injuryDate,
    expected_return_date: expectedReturnDate,
    note,
    created_by: appUser.id,
  });

  if (error) {
    console.error("addInjury() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("saveFailed"));
  }

  revalidatePath(`/talents/${talentId}`);
}

export async function deleteInjury(formData: FormData): Promise<void> {
  const t = await getTranslations("injuryActions");
  const injuryId = String(formData.get("injuryId") ?? "");
  const talentId = String(formData.get("talentId") ?? "");

  if (!injuryId || !talentId) {
    throw new Error(t("invalidRequest"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("talent_injuries")
    .delete()
    .eq("id", injuryId);

  if (error) {
    console.error("deleteInjury() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("deleteFailed"));
  }

  revalidatePath(`/talents/${talentId}`);
}
