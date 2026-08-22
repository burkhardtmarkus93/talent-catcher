import type { SupabaseClient } from "@supabase/supabase-js";

// Minimale, aber fachlich reale Umsetzung der Alert-Engine-Logik aus dem
// Konzeptdokument — bewusst reduziert gegenüber der vollen Spezifikation:
// - Torhüter-spezifische Schwellenwerte sind vorbereitet (Multiplikator),
//   aber die volle Altersstufen-Differenzierung (U15/U16 vs. U17-U19)
//   ist hier noch nicht abgebildet.
// - Hidden-Gem-Erkennung prüft "letzte Berichte konstant stark" ODER
//   "solide aktuelle Leistung + Potenzial-/Reifegrad-/TINDER-Signale",
//   NICHT zusätzlich "Status seit > 180 Tagen unverändert" — dafür
//   fehlt eine Statuswechsel-Historie, die es in diesem Prototyp noch
//   nicht gibt.
// Diese Vereinfachungen sind bewusst und sollten vor Produktivbetrieb
// gegen das volle Alert-Engine-Dokument nachgeschärft werden.
//
// Gewichtung der Zusatzsignale (TINDER/Potenzial/Reifegrad/Koordinations-
// test) unten ist eine begründete ERSTFASSUNG, keine abgestimmte
// Geschäftsentscheidung — bitte gegenprüfen, bevor sie sich auf reale
// Bewertungen auswirkt (siehe CLAUDE.md Kapitel 7: "Bei Unsicherheit über
// Produktentscheidungen ... nachfragen statt stillschweigend annehmen").
// Bewusst NICHT eingeflossen: dfb_stuetzpunkt/verbandsauswahl/
// nationalmannschaft/nlz — das sind Auswahl-/Förderstatus-Flags, keine
// Leistungs- oder Potenzialbewertungen; sie in einen Risikoscore zu
// pressen wäre eine Annahme, die so nirgends angefragt wurde.
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
    .select(
      "created_at, overall_rating, potenzial, reifegrad, tinder_trainingssensitivitaet, tinder_intelligenz, tinder_naturell, tinder_dynamik, tinder_erfolgsmotivation, tinder_resilienz"
    )
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

  // Nur für Torhüter relevant: jüngster Koordinationstest, als
  // zusätzliches Werthaltigkeits-Signal (siehe Multiplikator unten).
  let latestGkTestScore: number | null = null;
  if (isGoalkeeper) {
    const { data: gkTest, error: gkTestError } = await supabase
      .from("gk_coordination_tests")
      .select("total_score")
      .eq("talent_id", talentId)
      .order("test_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (gkTestError) {
      console.error(
        "recalculateAlertForTalent(): Koordinationstest konnte nicht geladen werden",
        gkTestError.message
      );
    } else {
      latestGkTestScore = gkTest?.total_score ?? null;
    }
  }

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

  // --- Uneinigkeits-Hinweis ---
  // Rein informativ, verändert weder Score noch Multiplikator: die
  // Risk-Engine konsolidiert Berichte unterschiedlicher Scouts (siehe
  // author_id in scout_reports) bereits stillschweigend zu einem
  // Durchschnitt/Trend. Bei großer Spannweite zwischen den letzten
  // Berichten soll das aber sichtbar werden, statt in der Glättung zu
  // verschwinden — Schwellenwert 1,5 Punkte ist eine Ersteinschätzung,
  // keine abgestimmte Geschäftsentscheidung (gleiche Einschränkung wie
  // beim Rest der Gewichtung, siehe Datei-Kommentar oben).
  const disagreementThreshold = 1.5;
  if (ratings.length >= 2) {
    const ratingSpread = Math.max(...ratings) - Math.min(...ratings);
    if (ratingSpread > disagreementThreshold) {
      reasons.push(
        `Uneinigkeit zwischen den letzten Scout-Berichten (Bewertungsspanne ${ratingSpread.toFixed(1)} Punkte)`
      );
    }
  }

  // Potenzial/Reifegrad/TINDER-Kriterien beziehen sich auf die
  // Einschätzung des Scouts zum Zeitpunkt des jüngsten Berichts, nicht
  // auf einen Verlauf — anders als overall_rating werden sie deshalb aus
  // reports[0] gelesen, nicht gemittelt.
  const latestReport = reports?.[0] ?? null;
  const latestPotenzial = latestReport?.potenzial ?? null;
  const latestReifegrad = latestReport?.reifegrad ?? null;

  const tinderValues = latestReport
    ? [
        latestReport.tinder_trainingssensitivitaet,
        latestReport.tinder_intelligenz,
        latestReport.tinder_naturell,
        latestReport.tinder_dynamik,
        latestReport.tinder_erfolgsmotivation,
        latestReport.tinder_resilienz,
      ].filter((v): v is number => v !== null && v !== undefined)
    : [];
  // Nur werten, wenn alle sechs TINDER-Kriterien im jüngsten Bericht
  // vorliegen — kein verzerrter Schnitt aus Teildaten.
  const tinderAvg = tinderValues.length === 6 ? tinderValues.reduce((a, b) => a + b, 0) / 6 : null;

  let multiplier = 1.0;
  if (avgRating !== null) {
    if (avgRating >= 4.5) multiplier = 1.4;
    else if (avgRating >= 4.0) multiplier = 1.2;
    else if (avgRating >= 3.0) multiplier = 1.0;
    else multiplier = 0.8;
  }

  const multiplierCap = 1.8;

  const trendThreshold = isGoalkeeper ? 0.3 : 0.5;
  const isUpwardTrend =
    ratings.length >= 2 && ratings[0] - ratings[ratings.length - 1] >= trendThreshold;
  if (isUpwardTrend) {
    multiplier = Math.min(multiplier + 0.2, multiplierCap);
    reasons.push("Aufwärtstrend über die letzten Berichte erkannt (Late-Bloomer-Signal)");
  }

  // Potenzial 1 = "hoch" (Skala 1–4, 1 ist bester Wert).
  const hasHighPotenzial = latestPotenzial === 1;
  if (hasHighPotenzial) {
    multiplier = Math.min(multiplier + 0.15, multiplierCap);
    reasons.push("Hohes Potenzial laut jüngstem Bericht");
  }

  // Reifegrad <= -1 = "eher spät" bis "Spätentwickler" (Skala -2..+2).
  // Nur relevant in Kombination mit bereits solider aktueller Leistung —
  // ein schwacher Spätentwickler ist kein eigenes Signal wert.
  const isLateBloomer = latestReifegrad !== null && latestReifegrad <= -1;
  if (isLateBloomer && avgRating !== null && avgRating >= 3.0) {
    multiplier = Math.min(multiplier + 0.1, multiplierCap);
    reasons.push("Spätentwickler mit bereits solider Leistung (Reifegrad-Signal)");
  }

  const hasStrongTinderAvg = tinderAvg !== null && tinderAvg >= 3.5;
  if (hasStrongTinderAvg) {
    multiplier = Math.min(multiplier + 0.1, multiplierCap);
    reasons.push("TINDER-Kriterien im jüngsten Bericht durchweg stark ausgeprägt");
  }

  const gkTestThreshold = 15; // von max. 18 Punkten (6 Tests × 0–3)
  const hasStrongGkTest = latestGkTestScore !== null && latestGkTestScore >= gkTestThreshold;
  if (hasStrongGkTest) {
    multiplier = Math.min(multiplier + 0.15, multiplierCap);
    reasons.push(`Starker Koordinationstest (${latestGkTestScore}/18 Punkten)`);
  }

  const isHiddenGemByRating =
    ratings.length >= (isGoalkeeper ? 2 : 3) && ratings.every((r) => r >= 4.0);
  if (isHiddenGemByRating) {
    reasons.push("Wiederholt stark bewertet (Hidden-Gem-Signal)");
  }

  // Zweiter Hidden-Gem-Pfad: (noch) keine durchweg exzellente Bewertung,
  // aber solide aktuelle Leistung (3.0–4.0) kombiniert mit Potenzial-
  // oder Reifegrad-Signal UND durchweg starken TINDER-Werten — genau das
  // Muster "zeigt sich noch nicht in der Rohbewertung, hat aber
  // erkennbares Entwicklungspotenzial".
  const isHiddenGemBySignals =
    !isHiddenGemByRating &&
    avgRating !== null &&
    avgRating >= 3.0 &&
    avgRating < 4.0 &&
    (hasHighPotenzial || isLateBloomer) &&
    hasStrongTinderAvg;
  if (isHiddenGemBySignals) {
    reasons.push(
      "Solide Leistung mit starken Potenzial-/Reifegrad-/TINDER-Signalen (Hidden-Gem-Signal)"
    );
  }

  const isHiddenGem = isHiddenGemByRating || isHiddenGemBySignals;

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
