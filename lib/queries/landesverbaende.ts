import { createClient } from "@/lib/supabase/server";
import type { Landesverband } from "@/lib/types";

// Reine Stammdaten (siehe public.landesverbaende, Migration
// 20260819100000) — für das Auswahlfeld in der Vereinsverwaltung, mit
// dem ein Verein sich seinem Landesverband zuordnet.
export async function getAllLandesverbaende(): Promise<Landesverband[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("landesverbaende")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    console.error("getAllLandesverbaende() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Landesverbände konnten nicht geladen werden.");
  }

  return (data ?? []).map((row) => ({ id: String(row.id), name: String(row.name) }));
}
