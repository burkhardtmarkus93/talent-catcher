"use server";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey, type BillingInterval } from "@/lib/plans";

export async function signUp(formData: FormData) {
  const t = await getTranslations("authActions");
  const clubName = String(formData.get("clubName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const plan = String(formData.get("plan") ?? "start") as PlanKey;
  const billingInterval = String(
    formData.get("billingInterval") ?? "monatlich"
  ) as BillingInterval;

  if (!clubName || !email || !password) {
    redirect(`/signup?error=${encodeURIComponent(t("fillRequiredFields"))}`);
  }

  if (password.length < 8) {
    redirect(`/signup?error=${encodeURIComponent(t("passwordTooShort"))}`);
  }

  const selectedPlan = PLANS[plan];
  if (!selectedPlan || !selectedPlan.selfService) {
    redirect(`/signup?error=${encodeURIComponent(t("planNotSelfService"))}`);
  }

  if (billingInterval !== "monatlich" && billingInterval !== "jaehrlich") {
    redirect(`/signup?error=${encodeURIComponent(t("invalidBillingInterval"))}`);
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
        error?.message ?? t("signupFailed")
      )}`
    );
  }

  redirect(`/login?success=${encodeURIComponent(t("signupSuccess"))}`);
}

export async function signIn(formData: FormData) {
  const t = await getTranslations("authActions");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent(t("provideEmailPassword"))}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(t("loginFailed"))}`);
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
  const t = await getTranslations("authActions");
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect(`/reset-password?error=${encodeURIComponent(t("provideEmail"))}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
  });

  if (error) {
    redirect(
      `/reset-password?error=${encodeURIComponent(t("resetLinkFailed"))}`
    );
  }

  redirect(
    `/reset-password?success=${encodeURIComponent(t("resetLinkSent"))}`
  );
}

export async function updatePassword(formData: FormData) {
  const t = await getTranslations("authActions");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!password || !confirmPassword) {
    redirect(`/update-password?error=${encodeURIComponent(t("fillBothFields"))}`);
  }

  if (password !== confirmPassword) {
    redirect(`/update-password?error=${encodeURIComponent(t("passwordsDontMatch"))}`);
  }

  if (password.length < 8) {
    redirect(`/update-password?error=${encodeURIComponent(t("passwordTooShort"))}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirect(
      `/update-password?error=${encodeURIComponent(t("passwordUpdateFailed"))}`
    );
  }

  redirect(`/login?success=${encodeURIComponent(t("passwordUpdated"))}`);
}
