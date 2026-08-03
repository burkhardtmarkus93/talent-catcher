"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/queries/session";

export async function addTalentTag(talentId: string, tag: string) {
  const cleanTag = tag.trim();
  if (!cleanTag) return;

  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) throw new Error("Kein Verein zugeordnet.");

  const supabase = await createClient();

  const { data: talent } = await supabase
    .from("talents")
    .select("tags, club_id")
    .eq("id", talentId)
    .maybeSingle();

  if (!talent || talent.club_id !== appUser.clubId) {
    throw new Error("Talent nicht gefunden oder keine Berechtigung.");
  }

  const currentTags: string[] = Array.isArray(talent.tags) ? talent.tags : [];
  if (currentTags.includes(cleanTag)) return;

  const { error } = await supabase
    .from("talents")
    .update({ tags: [...currentTags, cleanTag] })
    .eq("id", talentId);

  if (error) throw new Error("Tag konnte nicht gespeichert werden.");

  revalidatePath(`/talents/${talentId}`);
}

export async function removeTalentTag(talentId: string, tag: string) {
  const appUser = await getCurrentAppUser();
  if (!appUser?.clubId) throw new Error("Kein Verein zugeordnet.");

  const supabase = await createClient();

  const { data: talent } = await supabase
    .from("talents")
    .select("tags, club_id")
    .eq("id", talentId)
    .maybeSingle();

  if (!talent || talent.club_id !== appUser.clubId) {
    throw new Error("Talent nicht gefunden oder keine Berechtigung.");
  }

  const currentTags: string[] = Array.isArray(talent.tags) ? talent.tags : [];
  const { error } = await supabase
    .from("talents")
    .update({ tags: currentTags.filter((t) => t !== tag) })
    .eq("id", talentId);

  if (error) throw new Error("Tag konnte nicht entfernt werden.");

  revalidatePath(`/talents/${talentId}`);
}
