"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { recalculateAlertForTalent } from "@/lib/alerts/riskEngine";

export interface ScoutReportActionState {
  success: boolean;
  error?: string;
}

// Bewusst KEINE Berechnung von `overall_rating` hier im Server Action —
// das übernimmt der DB-Trigger `set_scout_report_rating` aus schema.sql.
// Diese Funktion liefert bei `calculated` gar keinen Wert mit, bei
// `manual_override` den vom Scout eingegebenen Wert. Der Trigger ist
// die einzige fachliche Quelle für die Berechnung — siehe Anweisung,
// keine doppelte Berechnungslogik im Frontend/Backend zu pflegen.
export async function createScoutReport(
  _prevState: ScoutReportActionState,
  formData: FormData
): Promise<ScoutReportActionState> {
  const t = await getTranslations("reportActions");
  const talentId = String(formData.get("talentId") ?? "");
  const reminderId = formData.get("reminderId")
    ? String(formData.get("reminderId"))
    : null;
  const matchDate = String(formData.get("matchDate") ?? "");
  const opponent = String(formData.get("opponent") ?? "").trim() || null;
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const scoreTechnik = Number(formData.get("scoreTechnik"));
  const scoreTaktik = Number(formData.get("scoreTaktik"));
  const scoreAthletik = Number(formData.get("scoreAthletik"));
  const scoreMentalitaet = Number(formData.get("scoreMentalitaet"));

  const tinderTrainingssensitivitaet = Number(
    formData.get("tinderTrainingssensitivitaet")
  );
  const tinderIntelligenz = Number(formData.get("tinderIntelligenz"));
  const tinderNaturell = Number(formData.get("tinderNaturell"));
  const tinderDynamik = Number(formData.get("tinderDynamik"));
  const tinderErfolgsmotivation = Number(
    formData.get("tinderErfolgsmotivation")
  );
  const tinderResilienz = Number(formData.get("tinderResilienz"));
  const potenzial = Number(formData.get("potenzial"));
  const reifegrad = Number(formData.get("reifegrad"));

  const overrideActive = formData.get("overrideActive") === "true";
  const overrideValueRaw = formData.get("overrideValue");
  const overrideReason = String(formData.get("overrideReason") ?? "").trim();

  // --- Serverseitige Validierung (Client-Validierung ist nur UX,
  // dies hier ist die eigentliche Absicherung) ---
  if (!talentId || !matchDate) {
    return { success: false, error: t("matchDateRequired") };
  }

  const scores = [scoreTechnik, scoreTaktik, scoreAthletik, scoreMentalitaet];
  if (scores.some((s) => !Number.isInteger(s) || s < 1 || s > 5)) {
    return {
      success: false,
      error: t("criteriaRange"),
    };
  }

  const tinderScores = [
    tinderTrainingssensitivitaet,
    tinderIntelligenz,
    tinderNaturell,
    tinderDynamik,
    tinderErfolgsmotivation,
    tinderResilienz,
  ];

  if (tinderScores.some((s) => !Number.isInteger(s) || s < 1 || s > 4)) {
    return {
      success: false,
      error: t("tinderRange"),
    };
  }

  if (!Number.isInteger(potenzial) || potenzial < 1 || potenzial > 4) {
    return {
      success: false,
      error: t("potenzialRange"),
    };
  }

  if (!Number.isInteger(reifegrad) || reifegrad < -2 || reifegrad > 2) {
    return {
      success: false,
      error: t("reifegradRange"),
    };
  }

  if (overrideActive && overrideReason.length === 0) {
    return {
      success: false,
      error: t("overrideReasonRequired"),
    };
  }

  const overrideValue = overrideValueRaw ? Number(overrideValueRaw) : null;
  if (overrideActive && (overrideValue === null || Number.isNaN(overrideValue))) {
    return { success: false, error: t("overrideValueInvalid") };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Sollte durch Middleware/Layout bereits verhindert sein —
    // zweite Schutzschicht, kein Rohfehler an die UI.
    return { success: false, error: t("sessionExpired") };
  }

  const insertPayload: Record<string, unknown> = {
    talent_id: talentId,
    author_id: user.id,
    match_date: matchDate,
    opponent,
    score_technik: scoreTechnik,
    score_taktik: scoreTaktik,
    score_athletik: scoreAthletik,
    score_mentalitaet: scoreMentalitaet,
    tinder_trainingssensitivitaet: tinderTrainingssensitivitaet,
    tinder_intelligenz: tinderIntelligenz,
    tinder_naturell: tinderNaturell,
    tinder_dynamik: tinderDynamik,
    tinder_erfolgsmotivation: tinderErfolgsmotivation,
    tinder_resilienz: tinderResilienz,
    potenzial,
    reifegrad,
    comment,
    overall_rating_source: overrideActive ? "manual_override" : "calculated",
  };

  if (overrideActive) {
    insertPayload.overall_rating = overrideValue;
    insertPayload.overall_rating_override_reason = overrideReason;
  }

  const { error: insertError } = await supabase
    .from("scout_reports")
    .insert(insertPayload);

  if (insertError) {
    console.error("createScoutReport() fehlgeschlagen:", insertError.message);
    return {
      success: false,
      error: t("saveFailed"),
    };
  }

  // Punkt 8 der Anweisung: falls der Bericht aus einem Reminder-Kontext
  // gestartet wurde, diesen direkt abschließen. Nur die offensichtliche,
  // eindeutige Zuordnung (reminderId aus dem Formular) — keine Suche
  // nach "passenden" Remindern, um keine falschen automatisch zu schließen.
  if (reminderId) {
    const { error: reminderError } = await supabase
      .from("reminders")
      .update({
        status: "erledigt",
        completed_at: new Date().toISOString(),
        completed_by: user.id,
      })
      .eq("id", reminderId)
      .in("status", ["offen", "ueberfaellig"]);

    if (reminderError) {
      // Bewusst kein harter Fehler für den Nutzer: der Bericht ist
      // bereits gespeichert, das Schließen des Reminders ist sekundär.
      console.error(
        "Reminder konnte nach Bericht nicht automatisch abgeschlossen werden:",
        reminderError.message
      );
    }
  }

  // Minimale, aber echte Neuberechnung direkt nach dem Bericht (und nach
  // dem Reminder-Abschluss, damit ein soeben geschlossener überfälliger
  // Reminder nicht mehr in die neue Bewertung einfließt).
  await recalculateAlertForTalent(supabase, talentId);

  revalidatePath(`/talents/${talentId}`);
  revalidatePath("/talents");
  revalidatePath("/alerts-reminders");

  redirect(`/talents/${talentId}`);
}
