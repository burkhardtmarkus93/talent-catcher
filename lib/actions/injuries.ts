"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

export async function addInjury(formData: FormData): Promise<void> {
  const talentId = String(formData.get("talentId") ?? "");
  const injuryType = String(formData.get("injuryType") ?? "").trim();
  const injuryDate = String(formData.get("injuryDate") ?? "").trim();
  const expectedReturnDate =
    String(formData.get("expectedReturnDate") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!talentId) {
    throw new Error("Talent-ID fehlt.");
  }
  if (!injuryType || !injuryDate) {
    throw new Error("Art und Datum der Verletzung sind Pflichtfelder.");
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error("Nicht angemeldet.");
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
    throw new Error("Verletzung konnte nicht gespeichert werden.");
  }

  revalidatePath(`/talents/${talentId}`);
}

export async function deleteInjury(formData: FormData): Promise<void> {
  const injuryId = String(formData.get("injuryId") ?? "");
  const talentId = String(formData.get("talentId") ?? "");

  if (!injuryId || !talentId) {
    throw new Error("Ungültige Anfrage.");
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
    throw new Error("Verletzung konnte nicht entfernt werden.");
  }

  revalidatePath(`/talents/${talentId}`);
}
