import type { SupabaseClient } from "@supabase/supabase-js";

// Minimale, aber fachlich reale Umsetzung der Alert-Engine-Logik aus dem
// Konzeptdokument — bewusst reduziert gegenüber der vollen Spezifikation:
// - Torhüter-spezifische Schwellenwerte sind vorbereitet (Multiplikator),
//   aber die volle Altersstufen-Differenzierung (U15/U16 vs. U17-U19)
//   ist hier noch nicht abgebildet.
// - Hidden-Gem-Erkennung prüft nur "letzte Berichte konstant stark",
//   NICHT zusätzlich "Status seit > 180 Tagen unverändert" — dafür
//   fehlt eine Statuswechsel-Historie, die es in diesem Prototyp noch
//   nicht gibt.
// Diese Vereinfachungen sind bewusst und sollten vor Produktivbetrieb
// gegen das volle Alert-Engine-Dokument nachgeschärft werden.
export async function recalculateAlertForTalent(
  supabase: SupabaseClient,
  talentId: string
): Promise<void> {
  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("contract_end_date, primary_position, status")
    .eq("id", talentId)
    .single();

  if (talentError || !talent) {
    console.error("recalculateAlertForTalent(): Talent nicht gefunden", talentError?.message);
    return;
  }

  // "verlorene" Talente werden laut Konzept nicht mehr neu bewertet —
  // der letzte Stand bleibt als historischer Kontext stehen.
  if (talent.status === "verloren") return;

  const { data: reports, error: reportsError } = await supabase
    .from("scout_reports")
    .select("created_at, overall_rating")
    .eq("talent_id", talentId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (reportsError) {
    console.error("recalculateAlertForTalent(): Berichte konnten nicht geladen werden", reportsError.message);
    return;
  }

  const { count: overdueReminderCount, error: reminderError } = await supabase
    .from("reminders")
    .select("id", { count: "exact", head: true })
    .eq("talent_id", talentId)
    .eq("status", "ueberfaellig");

  if (reminderError) {
    console.error("recalculateAlertForTalent(): Reminder-Status konnte nicht geladen werden", reminderError.message);
    return;
  }

  const isGoalkeeper = talent.primary_position === "TW";
  const reasons: string[] = [];
  let neglectScore = 0;

  // --- Zeitkomponente: Tage seit letztem Bericht ---
  const daysSinceLastReport = reports?.[0]
    ? Math.floor((Date.now() - new Date(reports[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const gapThresholdYellow = isGoalkeeper ? 68 : 45;
  const gapThresholdRed = isGoalkeeper ? 135 : 90;

  if (daysSinceLastReport === null) {
    neglectScore += 20;
    reasons.push("Noch kein Bericht vorhanden");
  } else if (daysSinceLastReport > gapThresholdRed) {
    neglectScore += 60;
    reasons.push(`Kein Bericht seit ${daysSinceLastReport} Tagen`);
  } else if (daysSinceLastReport > gapThresholdYellow) {
    neglectScore += 20;
    reasons.push(`Kein Bericht seit ${daysSinceLastReport} Tagen`);
  }

  // --- Wiedervorlage-Komponente ---
  if ((overdueReminderCount ?? 0) > 0) {
    neglectScore += 25;
    reasons.push("Wiedervorlage überfällig");
  }

  // --- Vertragskomponente ---
  if (talent.contract_end_date) {
    const daysToContractEnd = Math.floor(
      (new Date(talent.contract_end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysToContractEnd < 90 && (daysSinceLastReport === null || daysSinceLastReport > 30)) {
      neglectScore += 30;
      reasons.push(`Vertrag läuft in ${Math.max(daysToContractEnd, 0)} Tagen aus`);
    }
  }

  neglectScore = Math.min(neglectScore, 100);

  // --- Werthaltigkeits-Multiplikator ---
  const ratings = (reports ?? []).map((r) => Number(r.overall_rating)).filter((n) => !Number.isNaN(n));
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  let multiplier = 1.0;
  if (avgRating !== null) {
    if (avgRating >= 4.5) multiplier = 1.4;
    else if (avgRating >= 4.0) multiplier = 1.2;
    else if (avgRating >= 3.0) multiplier = 1.0;
    else multiplier = 0.8;
  }

  const trendThreshold = isGoalkeeper ? 0.3 : 0.5;
  const isUpwardTrend =
    ratings.length >= 2 && ratings[0] - ratings[ratings.length - 1] >= trendThreshold;
  if (isUpwardTrend) {
    multiplier = Math.min(multiplier + 0.2, 1.5);
    reasons.push("Aufwärtstrend über die letzten Berichte erkannt (Late-Bloomer-Signal)");
  }

  const isHiddenGem =
    ratings.length >= (isGoalkeeper ? 2 : 3) && ratings.every((r) => r >= 4.0);
  if (isHiddenGem) {
    reasons.push("Wiederholt stark bewertet (Hidden-Gem-Signal)");
  }

  const riskScore = Math.min(Math.round(neglectScore * multiplier * 100) / 100, 100);
  const riskLevel = riskScore >= 60 ? "rot" : riskScore >= 30 ? "gelb" : "gruen";

  // Alten aktuellen Alert deaktivieren, neuen als aktuell speichern.
  // Hinweis: kein DB-Transaction-Wrapper in diesem Prototyp — für
  // Produktivbetrieb sollte dies als einzelne Postgres-Funktion
  // (RPC) atomar laufen, um Race Conditions bei parallelen
  // Neuberechnungen sicher auszuschließen.
  const { error: deactivateError } = await supabase
    .from("alerts")
    .update({ is_current: false })
    .eq("talent_id", talentId)
    .eq("is_current", true);

  if (deactivateError) {
    console.error("recalculateAlertForTalent(): alter Alert konnte nicht deaktiviert werden", deactivateError.message);
    return;
  }

  const { error: insertError } = await supabase.from("alerts").insert({
    talent_id: talentId,
    risk_level: riskLevel,
    risk_score: riskScore,
    triggered_reasons: reasons,
    is_hidden_gem: isHiddenGem,
    is_current: true,
  });

  if (insertError) {
    console.error("recalculateAlertForTalent(): neuer Alert konnte nicht gespeichert werden", insertError.message);
  }
}
