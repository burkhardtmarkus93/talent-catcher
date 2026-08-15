"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
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
  redirect("/profile?success=Profil%20aktualisiert.");
}

// Eigenständig statt lib/actions/auth.ts::updatePassword() wiederverwendet:
// die dortige Version leitet bei Fehlern auf /update-password um (passend
// für den Recovery-Link-Flow, aus dem sie stammt) — hier soll ein Fehler
// zurück auf /profile führen, nicht auf eine andere Seite springen.
export async function changeMyPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    redirect("/profile?error=Bitte%20beide%20Felder%20ausf%C3%BCllen");
  }
  if (password !== confirmPassword) {
    redirect("/profile?error=Die%20Passw%C3%B6rter%20stimmen%20nicht%20%C3%BCberein");
  }
  if (password.length < 8) {
    redirect("/profile?error=Das%20Passwort%20muss%20mindestens%208%20Zeichen%20haben");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect("/profile?error=Passwort%20konnte%20nicht%20aktualisiert%20werden.");
  }

  redirect("/login?success=Passwort%20erfolgreich%20aktualisiert%20%E2%80%94%20bitte%20erneut%20anmelden.");
}
