import { createClient } from "@/lib/supabase/server";

const INACTIVITY_THRESHOLD_MONTHS = 3;

export interface TalentActivityStatus {
  lastActivityAt: Date;
  isInactive: boolean;
}

export async function getTalentActivityStatus(
  talentId: string,
  talentUpdatedAt: string
): Promise<TalentActivityStatus> {
  const supabase = await createClient();

  const [{ data: latestReport }, { data: latestReminder }] = await Promise.all([
    supabase
      .from("scout_reports")
      .select("created_at")
      .eq("talent_id", talentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("reminders")
      .select("created_at, completed_at")
      .eq("talent_id", talentId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const candidateDates: string[] = [talentUpdatedAt];
  if (latestReport?.created_at) candidateDates.push(latestReport.created_at);
  if (latestReminder?.created_at) candidateDates.push(latestReminder.created_at);
  if (latestReminder?.completed_at) candidateDates.push(latestReminder.completed_at);

  const lastActivityAt = new Date(
    Math.max(...candidateDates.map((d) => new Date(d).getTime()))
  );

  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - INACTIVITY_THRESHOLD_MONTHS);

  return {
    lastActivityAt,
    isInactive: lastActivityAt < threshold,
  };
}
