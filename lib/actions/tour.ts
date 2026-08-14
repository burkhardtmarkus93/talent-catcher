"use server";

import { createClient } from "@/lib/supabase/server";

export async function markIntroTourSeen() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("users")
    .update({ has_seen_intro_tour: true })
    .eq("id", user.id);
}
