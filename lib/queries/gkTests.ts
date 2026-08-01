import { createClient } from "@/lib/supabase/server";

export type GkCoordinationTest = {
  id: string;
  talentId: string;
  testerId: string | null;
  testDate: string;
  ageCategory: string | null;
  scoreWechselwurf: number | null;
  scoreKreuzprellen: number | null;
  scoreWandreaktion: number | null;
  scoreDoppelwandwurf: number | null;
  scoreWurfdrehung: number | null;
  scoreDoppeldrehung: number | null;
  totalScore: number | null;
  createdAt: string;
};

export async function getGkCoordinationTestsForTalent(
  talentId: string
): Promise<GkCoordinationTest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gk_coordination_tests")
    .select("*")
    .eq("talent_id", talentId)
    .order("test_date", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    talentId: row.talent_id,
    testerId: row.tester_id,
    testDate: row.test_date,
    ageCategory: row.age_category,
    scoreWechselwurf: row.score_wechselwurf,
    scoreKreuzprellen: row.score_kreuzprellen,
    scoreWandreaktion: row.score_wandreaktion,
    scoreDoppelwandwurf: row.score_doppelwandwurf,
    scoreWurfdrehung: row.score_wurfdrehung,
    scoreDoppeldrehung: row.score_doppeldrehung,
    totalScore: row.total_score,
    createdAt: row.created_at,
  }));
}
