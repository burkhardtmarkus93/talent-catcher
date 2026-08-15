import { createClient } from "@/lib/supabase/server";

// Nur relevant für minderjährige Talente (siehe CLAUDE.md Kapitel 3:
// Fotos/Videos gelten im Zweifel als sensible Daten). Ein Nutzer ohne
// Jugendschutz-Zugriff sieht laut RLS (consent_records_select_youth_access,
// 20260722213000_rls_extended.sql) ohnehin keine consent_records-Zeilen
// und bekommt hier also immer false — kann für Minderjährige also auch
// nichts hochladen, ohne dass diese Funktion das extra prüfen müsste.
export async function hasGrantedVideoConsent(talentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("consent_records")
    .select("id, valid_until")
    .eq("talent_id", talentId)
    .eq("scope", "video_material")
    .eq("status", "erteilt")
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return false;
  if (data.valid_until && new Date(data.valid_until) < new Date()) return false;
  return true;
}
