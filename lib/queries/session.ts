import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";

// Liest den eingeloggten Nutzer inkl. Rolle/Mandant aus `public.users`.
// Gibt `null` zurück, wenn keine Session vorliegt ODER die Zeile in
// `public.users` (noch) fehlt.
export async function getCurrentAppUser(): Promise<AppUser | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile, error } = await supabase
    .from("users")
    .select(
      "id, club_id, landesverband_id, email, role, has_youth_access, has_seen_intro_tour, clubs(plan)"
    )
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !profile) {
    return null;
  }

  const club = Array.isArray(profile.clubs) ? profile.clubs[0] : profile.clubs;

  return {
    id: profile.id,
    email: profile.email,
    clubId: profile.club_id,
    landesverbandId: profile.landesverband_id,
    role: profile.role,
    hasYouthAccess: profile.has_youth_access,
    clubPlan: club?.plan ?? null,
    hasSeenIntroTour: profile.has_seen_intro_tour,
  };
}
