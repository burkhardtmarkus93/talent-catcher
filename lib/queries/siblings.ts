import { createClient } from "@/lib/supabase/server";

export interface TalentSibling {
  id: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  note: string | null;
  createdAt: string;
}

export async function getSiblingsForTalent(
  talentId: string
): Promise<TalentSibling[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talent_siblings")
    .select("id, first_name, last_name, birth_date, note, created_at")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getSiblingsForTalent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Geschwister konnten nicht geladen werden.");
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    birthDate: row.birth_date,
    note: row.note,
    createdAt: row.created_at,
  }));
}
