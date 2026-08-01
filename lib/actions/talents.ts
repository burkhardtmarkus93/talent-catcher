"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
