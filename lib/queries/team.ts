import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export interface TeamMember {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  hasYouthAccess: boolean;
  isActive: boolean;
}

export async function getClubMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, has_youth_access, is_active")
    .order("role", { ascending: false })
    .order("email", { ascending: true });

  if (error) {
    console.error("getClubMembers() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
    });
    throw new Error("Teammitglieder konnten nicht geladen werden.");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    hasYouthAccess: row.has_youth_access,
    isActive: row.is_active,
  }));
}
