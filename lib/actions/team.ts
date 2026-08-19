"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

async function requireClubAdmin() {
  const t = await getTranslations("teamActions");
  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId || appUser.role !== "admin") {
    redirect(`/dashboard?error=${encodeURIComponent(t("adminsOnly"))}`);
  }
  return appUser;
}

export async function inviteTeamMember(formData: FormData) {
  const t = await getTranslations("teamActions");
  const appUser = await requireClubAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "scout");

  if (!email) {
    redirect(`/admin?error=${encodeURIComponent(t("provideEmail"))}`);
  }
  if (role !== "scout" && role !== "admin") {
    redirect(`/admin?error=${encodeURIComponent(t("invalidRole"))}`);
  }

  const admin = createAdminClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm`,
    data: {
      pending_club_id: appUser.clubId,
      pending_role: role,
    },
  });

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?success=${encodeURIComponent(t("invitationSent"))}`);
}

export async function updateTeamMemberRole(formData: FormData) {
  const t = await getTranslations("teamActions");
  const appUser = await requireClubAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  const hasYouthAccess = formData.get("hasYouthAccess") === "on";

  if (!userId || (role !== "scout" && role !== "admin")) {
    redirect(`/admin?error=${encodeURIComponent(t("invalidInput"))}`);
  }

  if (userId === appUser.id) {
    redirect(
      `/admin?error=${encodeURIComponent(t("cannotChangeOwnRole"))}`
    );
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({ role, has_youth_access: hasYouthAccess })
    .eq("id", userId)
    .eq("club_id", appUser.clubId!);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect(`/admin?success=${encodeURIComponent(t("memberUpdated"))}`);
}

export async function setTeamMemberActive(formData: FormData) {
  const t = await getTranslations("teamActions");
  const appUser = await requireClubAdmin();

  const userId = String(formData.get("userId") ?? "");
  const isActive = formData.get("isActive") === "true";

  if (!userId) {
    redirect(`/admin?error=${encodeURIComponent(t("invalidInput"))}`);
  }

  if (userId === appUser.id) {
    redirect(
      `/admin?error=${encodeURIComponent(t("cannotDeactivateSelf"))}`
    );
  }

  const supabase = await createClient();

  if (!isActive) {
    // Verein darf nicht ohne aktiven Admin dastehen.
    const { count } = await supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("club_id", appUser.clubId!)
      .eq("role", "admin")
      .eq("is_active", true);

    const { data: target } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    if (target?.role === "admin" && (count ?? 0) <= 1) {
      redirect(
        `/admin?error=${encodeURIComponent(t("cannotDeactivateLastAdmin"))}`
      );
    }
  }

  const { error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", userId)
    .eq("club_id", appUser.clubId!);

  if (error) {
    redirect(`/admin?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin");
  redirect(
    isActive
      ? `/admin?success=${encodeURIComponent(t("memberReactivated"))}`
      : `/admin?success=${encodeURIComponent(t("memberDeactivated"))}`
  );
}
