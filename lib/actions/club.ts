"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

export async function updateClubName(formData: FormData) {
  const t = await getTranslations("clubActions");
  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId || appUser.role !== "admin") {
    redirect(`/dashboard?error=${encodeURIComponent(t("adminsOnly"))}`);
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect(`/admin?error=${encodeURIComponent(t("clubNameRequired"))}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clubs")
    .update({ name })
    .eq("id", appUser.clubId);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?success=${encodeURIComponent(t("clubNameUpdated"))}`);
}
