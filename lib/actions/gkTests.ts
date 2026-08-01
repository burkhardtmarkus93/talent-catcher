"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createGkCoordinationTest(formData: FormData) {
  const talentId = String(formData.get("talentId") ?? "");
  const testDateRaw = String(formData.get("testDate") ?? "");

  if (!talentId) {
    redirect("/talents?error=Ung%C3%BCltiges%20Talent");
  }

  const toScore = (name: string) => {
    const raw = formData.get(name);
    if (raw === null || raw === "") return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("gk_coordination_tests").insert({
    talent_id: talentId,
    tester_id: user?.id ?? null,
    test_date: testDateRaw || undefined,
    score_wechselwurf: toScore("scoreWechselwurf"),
    score_kreuzprellen: toScore("scoreKreuzprellen"),
    score_wandreaktion: toScore("scoreWandreaktion"),
    score_doppelwandwurf: toScore("scoreDoppelwandwurf"),
    score_wurfdrehung: toScore("scoreWurfdrehung"),
    score_doppeldrehung: toScore("scoreDoppeldrehung"),
  });

  if (error) {
    redirect(
      `/talents/${talentId}/gk-tests/new?error=Test%20konnte%20nicht%20gespeichert%20werden.`
    );
  }

  revalidatePath(`/talents/${talentId}`);
  redirect(`/talents/${talentId}`);
}
