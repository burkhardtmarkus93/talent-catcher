"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const t = await getTranslations("profileActions");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName = String(formData.get("fullName") ?? "").trim();

  const { error } = await supabase
    .from("users")
    .update({ full_name: fullName || null })
    .eq("id", user.id);

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/profile");
  redirect(`/profile?success=${encodeURIComponent(t("profileUpdated"))}`);
}

// Eigenständig statt lib/actions/auth.ts::updatePassword() wiederverwendet:
// die dortige Version leitet bei Fehlern auf /update-password um (passend
// für den Recovery-Link-Flow, aus dem sie stammt) — hier soll ein Fehler
// zurück auf /profile führen, nicht auf eine andere Seite springen.
export async function changeMyPassword(formData: FormData) {
  const t = await getTranslations("profileActions");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    redirect(`/profile?error=${encodeURIComponent(t("fillBothFields"))}`);
  }
  if (password !== confirmPassword) {
    redirect(`/profile?error=${encodeURIComponent(t("passwordsDontMatch"))}`);
  }
  if (password.length < 8) {
    redirect(`/profile?error=${encodeURIComponent(t("passwordTooShort"))}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(`/profile?error=${encodeURIComponent(t("passwordUpdateFailed"))}`);
  }

  redirect(`/login?success=${encodeURIComponent(t("passwordUpdated"))}`);
}
