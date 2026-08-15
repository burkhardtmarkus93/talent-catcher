"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

export async function addSibling(formData: FormData): Promise<void> {
  const talentId = String(formData.get("talentId") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!talentId) {
    throw new Error("Talent-ID fehlt.");
  }
  if (!firstName || !lastName) {
    throw new Error("Vor- und Nachname sind Pflichtfelder.");
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error("Nicht angemeldet.");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("talent_siblings").insert({
    talent_id: talentId,
    first_name: firstName,
    last_name: lastName,
    birth_date: birthDate,
    note,
    created_by: appUser.id,
  });

  if (error) {
    console.error("addSibling() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Geschwister konnte nicht gespeichert werden.");
  }

  revalidatePath(`/talents/${talentId}`);
}

export async function deleteSibling(formData: FormData): Promise<void> {
  const siblingId = String(formData.get("siblingId") ?? "");
  const talentId = String(formData.get("talentId") ?? "");

  if (!siblingId || !talentId) {
    throw new Error("Ungültige Anfrage.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("talent_siblings")
    .delete()
    .eq("id", siblingId);

  if (error) {
    console.error("deleteSibling() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Geschwister konnte nicht entfernt werden.");
  }

  revalidatePath(`/talents/${talentId}`);
}
