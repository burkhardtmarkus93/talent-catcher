"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

async function requireClubAdmin() {
  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId || appUser.role !== "admin") {
    redirect("/dashboard?error=Nur%20f%C3%BCr%20Vereins-Admins.");
  }
  return appUser;
}

export async function inviteTeamMember(formData: FormData) {
  const appUser = await requireClubAdmin();

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "scout");

  if (!email) {
    redirect("/admin?error=Bitte%20E-Mail-Adresse%20angeben.");
  }
  if (role !== "scout" && role !== "admin") {
    redirect("/admin?error=Ung%C3%BCltige%20Rolle.");
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
  redirect("/admin?success=Einladung%20verschickt.");
}

export async function updateTeamMemberRole(formData: FormData) {
  const appUser = await requireClubAdmin();

  const userId = String(formData.get("userId") ?? "");
  const role = String(formData.get("role") ?? "");
  const hasYouthAccess = formData.get("hasYouthAccess") === "on";

  if (!userId || (role !== "scout" && role !== "admin")) {
    redirect("/admin?error=Ung%C3%BCltige%20Eingabe.");
  }

  if (userId === appUser.id) {
    redirect(
      "/admin?error=Die%20eigene%20Rolle%20kann%20nicht%20selbst%20ge%C3%A4ndert%20werden."
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
  redirect("/admin?success=Teammitglied%20aktualisiert.");
}

export async function setTeamMemberActive(formData: FormData) {
  const appUser = await requireClubAdmin();

  const userId = String(formData.get("userId") ?? "");
  const isActive = formData.get("isActive") === "true";

  if (!userId) {
    redirect("/admin?error=Ung%C3%BCltige%20Eingabe.");
  }

  if (userId === appUser.id) {
    redirect(
      "/admin?error=Das%20eigene%20Konto%20kann%20nicht%20deaktiviert%20werden."
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
        "/admin?error=Der%20letzte%20aktive%20Admin%20kann%20nicht%20deaktiviert%20werden."
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
      ? "/admin?success=Teammitglied%20reaktiviert."
      : "/admin?success=Teammitglied%20deaktiviert."
  );
}
