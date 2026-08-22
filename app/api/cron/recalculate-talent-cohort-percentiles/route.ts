import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Grober Positions-/Jahrgangs-Vergleich eines Talents gegenüber allen
// anderen Talenten derselben Position und desselben Geburtsjahrgangs,
// plattformweit über alle Vereine hinweg (Migration 20260822200000, auf
// ausdrücklichen Wunsch des Projektverantwortlichen). Läuft bewusst
// SELTENER als recalculate-alerts (dort täglich) -- ein grobes Quartil
// soll sich nicht wöchentlich ändern, das würde eine Präzision vortäuschen,
// die weder die zugrunde liegenden Scout-Berichte noch die Vergleichsbasis
// hergeben. Monatlich ist ein Kompromiss zwischen "spiegelt echte
// Entwicklung über eine Saison wider" und "wirkt nicht wie eine live
// nachverfolgte Rangliste".
//
// Bewusst KEIN Ranking mit Platzierung/Score in der Antwort oder in der
// gespeicherten Spalte -- nur eines von vier groben Quartils-Buckets.
// Vereine sehen zu keinem Zeitpunkt, welche anderen Vereine/Talente in
// derselben Vergleichsgruppe stecken (siehe talent_exists_at_club() für
// dasselbe Prinzip an anderer Stelle).
const MIN_COHORT_SIZE = 30;

type CohortEntry = {
  talentId: string;
  valueScore: number;
};

function bucketForPercentile(percentile: number): string {
  if (percentile >= 0.75) return "top25";
  if (percentile >= 0.5) return "upper_mid";
  if (percentile >= 0.25) return "lower_mid";
  return "bottom25";
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Nicht berechtigt." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: rows, error } = await supabase
    .from("alerts")
    .select(
      "talent_id, value_score, talent:talents!inner(id, primary_position, birth_date, archived_at, status)"
    )
    .eq("is_current", true)
    .not("value_score", "is", null);

  if (error) {
    console.error(
      "Cron recalculate-talent-cohort-percentiles: Daten konnten nicht geladen werden",
      error.message
    );
    return NextResponse.json(
      { error: "Daten konnten nicht geladen werden." },
      { status: 500 }
    );
  }

  // Kohorten bilden: Position + Geburtsjahrgang, nur aktive (nicht
  // archivierte, nicht "verloren") Talente mit vorhandenem value_score.
  const cohorts = new Map<string, CohortEntry[]>();

  for (const row of rows ?? []) {
    const talent = Array.isArray(row.talent) ? row.talent[0] : row.talent;
    if (!talent || talent.archived_at || talent.status === "verloren") continue;

    const birthYear = new Date(talent.birth_date).getFullYear();
    const cohortKey = `${talent.primary_position}::${birthYear}`;

    const entry: CohortEntry = {
      talentId: talent.id,
      valueScore: Number(row.value_score),
    };

    const existing = cohorts.get(cohortKey);
    if (existing) {
      existing.push(entry);
    } else {
      cohorts.set(cohortKey, [entry]);
    }
  }

  let updated = 0;
  let cleared = 0;
  let cohortsTooSmall = 0;

  for (const entries of cohorts.values()) {
    if (entries.length < MIN_COHORT_SIZE) {
      cohortsTooSmall += 1;
      for (const entry of entries) {
        const { error: clearError } = await supabase
          .from("talents")
          .update({ cohort_percentile_bucket: null, cohort_percentile_updated_at: null })
          .eq("id", entry.talentId);
        if (clearError) {
          console.error(
            "Cron recalculate-talent-cohort-percentiles: Zurücksetzen fehlgeschlagen",
            { talentId: entry.talentId, message: clearError.message }
          );
          continue;
        }
        cleared += 1;
      }
      continue;
    }

    const sorted = [...entries].sort((a, b) => a.valueScore - b.valueScore);
    const now = new Date().toISOString();

    for (let i = 0; i < sorted.length; i += 1) {
      const percentile = i / (sorted.length - 1);
      const bucket = bucketForPercentile(percentile);

      const { error: updateError } = await supabase
        .from("talents")
        .update({ cohort_percentile_bucket: bucket, cohort_percentile_updated_at: now })
        .eq("id", sorted[i].talentId);

      if (updateError) {
        console.error(
          "Cron recalculate-talent-cohort-percentiles: Update fehlgeschlagen",
          { talentId: sorted[i].talentId, message: updateError.message }
        );
        continue;
      }
      updated += 1;
    }
  }

  return NextResponse.json({ updated, cleared, cohortsTooSmall });
}
