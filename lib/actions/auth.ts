"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey, type BillingInterval } from "@/lib/plans";

export async function signUp(formData: FormData) {
  const clubName = String(formData.get("clubName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const plan = String(formData.get("plan") ?? "start") as PlanKey;
  const billingInterval = String(
    formData.get("billingInterval") ?? "monatlich"
  ) as BillingInterval;

  if (!clubName || !email || !password) {
    redirect("/signup?error=Bitte%20alle%20Pflichtfelder%20ausf%C3%BCllen");
  }

  if (password.length < 8) {
    redirect("/signup?error=Das%20Passwort%20muss%20mindestens%208%20Zeichen%20haben");
  }

  const selectedPlan = PLANS[plan];
  if (!selectedPlan || !selectedPlan.selfService) {
    redirect("/signup?error=Dieser%20Plan%20ist%20nicht%20per%20Selbstregistrierung%20verf%C3%BCgbar");
  }

  if (billingInterval !== "monatlich" && billingInterval !== "jaehrlich") {
    redirect("/signup?error=Ung%C3%BCltiger%20Abrechnungszeitraum");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      data: {
        pending_club_name: clubName,
        pending_plan: plan,
        pending_billing_interval: billingInterval,
      },
    },
  });

  if (error || !data.user) {
    redirect(
      `/signup?error=${encodeURIComponent(
        error?.message ?? "Registrierung fehlgeschlagen."
      )}`
    );
  }

  redirect(
    "/login?success=Fast%20geschafft%20%E2%80%94%20wir%20haben%20dir%20eine%20Best%C3%A4tigungs-E-Mail%20geschickt.%20Bitte%20Link%20anklicken%20und%20anschlie%C3%9Fend%20anmelden."
  );
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect("/login?error=Bitte%20E-Mail%20und%20Passwort%20angeben");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect("/login?error=Anmeldung%20fehlgeschlagen.%20Bitte%20Zugangsdaten%20pr%C3%BCfen.");
  }

  redirect("/dashboard");
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } finally {
    redirect("/login");
  }
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/reset-password?error=Bitte%20E-Mail%20angeben");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
  });

  if (error) {
    redirect(
      "/reset-password?error=Reset-Link%20konnte%20nicht%20gesendet%20werden."
    );
  }

  redirect(
    "/reset-password?success=Wenn%20ein%20Konto%20existiert,%20wurde%20ein%20Reset-Link%20gesendet."
  );
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    redirect("/update-password?error=Bitte%20beide%20Felder%20ausf%C3%BCllen");
  }

  if (password !== confirmPassword) {
    redirect("/update-password?error=Die%20Passw%C3%B6rter%20stimmen%20nicht%20%C3%BCberein");
  }

  if (password.length < 8) {
    redirect("/update-password?error=Das%20Passwort%20muss%20mindestens%208%20Zeichen%20haben");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      "/update-password?error=Passwort%20konnte%20nicht%20aktualisiert%20werden."
    );
  }

  redirect("/login?success=Passwort%20erfolgreich%20aktualisiert");
}
