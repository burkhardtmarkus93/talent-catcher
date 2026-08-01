"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type TalentActionState = {
  success: boolean;
  message?: string;
};

export async function createTalent(
  _prevState: TalentActionState,
  formData: FormData
): Promise<TalentActionState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const birthDate = String(formData.get("birthDate") ?? "").trim();
  const primaryPosition = String(formData.get("primaryPosition") ?? "").trim();

  if (!firstName || !lastName || !birthDate || !primaryPosition) {
    return {
      success: false,
      message: "Bitte alle Pflichtfelder ausfüllen.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("talents").insert({
    first_name: firstName,
    last_name: lastName,
    birth_date: birthDate,
    primary_position: primaryPosition,
    status: "in_beobachtung",
    visibility_status: "freigegeben",
  });

  if (error) {
    return {
      success: false,
      message: "Talent konnte nicht erstellt werden.",
    };
  }

  revalidatePath("/talents");
  redirect("/talents");
}

export async function archiveTalent(formData: FormData) {
  const talentId = String(formData.get("talentId") ?? "");
  if (!talentId) throw new Error("Talent-ID fehlt.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("talents")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", talentId);

  if (error) throw new Error("Talent konnte nicht archiviert werden.");

  revalidatePath("/talents");
  revalidatePath(`/talents/${talentId}`);
  redirect(`/talents/${talentId}`);
}

export async function restoreTalent(formData: FormData) {
  const talentId = String(formData.get("talentId") ?? "");
  if (!talentId) throw new Error("Talent-ID fehlt.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("talents")
    .update({ archived_at: null })
    .eq("id", talentId);

  if (error) throw new Error("Talent konnte nicht wiederhergestellt werden.");

  revalidatePath("/talents");
  revalidatePath(`/talents/${talentId}`);
  redirect(`/talents/${talentId}`);
}
