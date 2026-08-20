import { createClient } from "@/lib/supabase/server";
import type { PublicClubOption, TalentCandidate } from "@/lib/types";

function mapCandidate(row: any): TalentCandidate {
  return {
    id: String(row.id),
    clubId: String(row.club_id),
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
    birthDate: String(row.birth_date ?? ""),
    primaryPosition: String(row.primary_position ?? ""),
    contactEmail: String(row.contact_email ?? ""),
    isMinor: Boolean(row.is_minor),
    guardianEmail: row.guardian_email ?? null,
    guardianConfirmedAt: row.guardian_confirmed_at ?? null,
    status: row.status ?? "pending_review",
    createdAt: row.created_at,
  };
}

// Für das öffentliche Registrierungsformular — unabhängig vom Login,
// siehe public_club_directory (Migration 20260821100000).
export async function getPublicClubOptions(): Promise<PublicClubOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_club_directory")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("getPublicClubOptions() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Vereinsliste konnte nicht geladen werden.");
  }

  return (data ?? []).map((row: any) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
  }));
}

// Für die Kandidaten-Warteschlange im Verein — RLS
// (talent_candidates_select_same_club) sorgt bereits dafür, dass nur
// zum eigenen Verein gehörige, tatsächlich prüfbare Kandidaturen
// zurückkommen (Minderjährige erst nach bestätigter
// Erziehungsberechtigten-Einwilligung, siehe Migrationskommentar).
export async function getPendingTalentCandidates(): Promise<TalentCandidate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_candidates")
    .select("*")
    .eq("status", "pending_review")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getPendingTalentCandidates() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Kandidaturen konnten nicht geladen werden.");
  }

  return (data ?? []).map(mapCandidate);
}
