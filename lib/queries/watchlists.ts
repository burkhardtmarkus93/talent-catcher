import { createClient } from "@/lib/supabase/server";
import type { Watchlist } from "@/lib/types";

function mapWatchlist(row: any): Watchlist {
  const talentCount = Array.isArray(row.watchlist_talents)
    ? row.watchlist_talents[0]?.count ?? 0
    : 0;

  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: row.description ?? null,
    talentCount,
  };
}

export async function getWatchlists(): Promise<Watchlist[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("watchlists")
    .select("id, name, description, watchlist_talents(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getWatchlists() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Watchlists konnten nicht geladen werden.");
  }

  return (data ?? []).map(mapWatchlist);
}
