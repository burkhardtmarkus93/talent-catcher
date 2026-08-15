import { createClient } from "@/lib/supabase/server";

export interface TalentInjury {
  id: string;
  injuryType: string;
  injuryDate: string;
  expectedReturnDate: string | null;
  note: string | null;
  createdAt: string;
}

export async function getInjuriesForTalent(
  talentId: string
): Promise<TalentInjury[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_injuries")
    .select("id, injury_type, injury_date, expected_return_date, note, created_at")
    .eq("talent_id", talentId)
    .order("injury_date", { ascending: false });

  if (error) {
    console.error("getInjuriesForTalent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Verletzungen konnten nicht geladen werden.");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    injuryType: row.injury_type,
    injuryDate: row.injury_date,
    expectedReturnDate: row.expected_return_date,
    note: row.note,
    createdAt: row.created_at,
  }));
}
