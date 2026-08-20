import { createClient } from "@/lib/supabase/server";
import type { LandesverbandTalent } from "@/lib/types";

function mapLandesverbandTalent(row: any): LandesverbandTalent {
  return {
    id: String(row.id),
    clubId: String(row.club_id),
    clubRegisteredName: String(row.club_registered_name ?? ""),
    clubNameText: row.club_name_text ?? null,
    teamNameText: row.team_name_text ?? null,
    firstName: String(row.first_name ?? ""),
    lastName: String(row.last_name ?? ""),
    birthDate: String(row.birth_date ?? ""),
    primaryPosition: String(row.primary_position ?? ""),
    secondaryPosition: row.secondary_position ?? null,
    isMinor: Boolean(row.is_minor),
    dfbStuetzpunkt: Boolean(row.dfb_stuetzpunkt),
    verbandsauswahl: Boolean(row.verbandsauswahl),
    nationalmannschaft: Boolean(row.nationalmannschaft),
    nlz: Boolean(row.nlz),
    updatedAt: row.updated_at,
  };
}

// Für Landesverbands-Accounts: alle freigegebenen Talente der Vereine,
// die sich diesem Landesverband zugeordnet haben (siehe
// landesverband_talents_view, Migration 20260819100000).
export async function getLandesverbandTalents(): Promise<LandesverbandTalent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("landesverband_talents_view")
    .select("*")
    .order("club_registered_name", { ascending: true })
    .order("last_name", { ascending: true });

  if (error) {
    console.error("getLandesverbandTalents() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Talente konnten nicht geladen werden.");
  }

  return (data ?? []).map(mapLandesverbandTalent);
}
