"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

export async function addTalentTag(talentId: string, tag: string) {
  const t = await getTranslations("tagActions");
  const cleanTag = tag.trim();
  if (!cleanTag) return;

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) throw new Error(t("noClubAssigned"));

  const supabase = await createClient();

  const { data: talent } = await supabase
    .from("talents")
    .select("tags, club_id")
    .eq("id", talentId)
    .maybeSingle();

  if (!talent || talent.club_id !== appUser.clubId) {
    throw new Error(t("talentNotFoundOrForbidden"));
  }

  const currentTags: string[] = Array.isArray(talent.tags) ? talent.tags : [];
  if (currentTags.includes(cleanTag)) return;

  const { error } = await supabase
    .from("talents")
    .update({ tags: [...currentTags, cleanTag] })
    .eq("id", talentId);

  if (error) throw new Error(t("addFailed"));

  revalidatePath(`/talents/${talentId}`);
}

export async function removeTalentTag(talentId: string, tag: string) {
  const t = await getTranslations("tagActions");
  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) throw new Error(t("noClubAssigned"));

  const supabase = await createClient();

  const { data: talent } = await supabase
    .from("talents")
    .select("tags, club_id")
    .eq("id", talentId)
    .maybeSingle();

  if (!talent || talent.club_id !== appUser.clubId) {
    throw new Error(t("talentNotFoundOrForbidden"));
  }

  const currentTags: string[] = Array.isArray(talent.tags) ? talent.tags : [];
  const { error } = await supabase
    .from("talents")
    .update({ tags: currentTags.filter((tagValue) => tagValue !== tag) })
    .eq("id", talentId);

  if (error) throw new Error(t("removeFailed"));

  revalidatePath(`/talents/${talentId}`);
}
