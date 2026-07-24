import { createClient } from "@/lib/supabase/server";
import type { AppUser } from "@/lib/types";

// Liest den eingeloggten Nutzer inkl. Rolle/Mandant aus `public.users`.
// Gibt `null` zurück, wenn keine Session vorliegt ODER die Zeile in
// `public.users` (noch) fehlt — beide Fälle behandelt der Aufrufer
// gleich (siehe (dashboard)/layout.tsx: Redirect nach /login).
export async function getCurrentAppUser(): Promise<AppUser | null> {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data: profile, error } = await supabase
    .from("users")
    .select("id, club_id, email, role, has_youth_access")
    .eq("id", authUser.id)
    .single();

  if (error || !profile) {
    // Auth-Session existiert, aber kein passendes public.users-Profil —
    // kann bei frisch angelegten Auth-Nutzern vorkommen, die noch nicht
    // in public.users nachgezogen wurden.
    return null;
  }

  return {
    id: profile.id,
    email: profile.email,
    clubId: profile.club_id,
    role: profile.role,
    hasYouthAccess: profile.has_youth_access,
  };
}
