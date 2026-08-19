"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

export async function createWatchlist(formData: FormData): Promise<void> {
  const t = await getTranslations("watchlistActions");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;

  if (!name) {
    throw new Error(t("nameRequired"));
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error(t("notAuthenticated"));
  }

  const supabase = await createClient();
  const { data: inserted, error } = await supabase
    .from("watchlists")
    .insert({
      club_id: appUser.clubId,
      owner_id: appUser.id,
      name,
      description,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("createWatchlist() fehlgeschlagen:", {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    throw new Error(t("createFailed"));
  }

  revalidatePath("/watchlists");
  redirect(`/watchlists/${inserted.id}`);
}

export async function addTalentToWatchlist(formData: FormData): Promise<void> {
  const t = await getTranslations("watchlistActions");
  const watchlistId = String(formData.get("watchlistId") ?? "");
  const talentId = String(formData.get("talentId") ?? "");

  if (!watchlistId || !talentId) {
    throw new Error(t("selectTalent"));
  }

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) {
    throw new Error(t("notAuthenticated"));
  }

  const supabase = await createClient();
  const { error } = await supabase.from("watchlist_talents").insert({
    watchlist_id: watchlistId,
    talent_id: talentId,
    added_by: appUser.id,
  });

  if (error) {
    console.error("addTalentToWatchlist() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("addFailed"));
  }

  revalidatePath(`/watchlists/${watchlistId}`);
}

export async function removeTalentFromWatchlist(formData: FormData): Promise<void> {
  const t = await getTranslations("watchlistActions");
  const watchlistId = String(formData.get("watchlistId") ?? "");
  const talentId = String(formData.get("talentId") ?? "");

  if (!watchlistId || !talentId) {
    throw new Error(t("invalidRequest"));
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("watchlist_talents")
    .delete()
    .eq("watchlist_id", watchlistId)
    .eq("talent_id", talentId);

  if (error) {
    console.error("removeTalentFromWatchlist() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error(t("removeFailed"));
  }

  revalidatePath(`/watchlists/${watchlistId}`);
}
