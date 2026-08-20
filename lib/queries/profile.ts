import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export interface MyProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  hasYouthAccess: boolean;
  clubName: string | null;
  clubLandesverbandId: string | null;
}

export async function getMyProfile(): Promise<MyProfile | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, has_youth_access, clubs(name, landesverband_id)")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error || !data) return null;

  const club = Array.isArray(data.clubs) ? data.clubs[0] : data.clubs;

  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    role: data.role,
    hasYouthAccess: data.has_youth_access,
    clubName: club?.name ?? null,
    clubLandesverbandId: club?.landesverband_id ?? null,
  };
}
