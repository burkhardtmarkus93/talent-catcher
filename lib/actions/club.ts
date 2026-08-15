"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

export async function updateClubName(formData: FormData) {
  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId || appUser.role !== "admin") {
    redirect("/dashboard?error=Nur%20f%C3%BCr%20Vereins-Admins.");
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    redirect("/admin?error=Vereinsname%20darf%20nicht%20leer%20sein.");
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
  redirect("/admin?success=Vereinsname%20aktualisiert.");
}
