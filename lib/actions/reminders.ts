"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface ReminderActionState {
  success: boolean;
  error?: string;
}

// Kleiner, bewusst schlanker manueller Reminder-Flow — kein
// systemgeneriertes Intervall-Handling in diesem Prototyp (das bleibt
// dem späteren Nachtjob vorbehalten). Nur: Datum + optionaler Grund.
export async function createReminder(
  _prevState: ReminderActionState,
  formData: FormData
): Promise<ReminderActionState> {
  const talentId = String(formData.get("talentId") ?? "");
  const dueDate = String(formData.get("dueDate") ?? "");
  const reason = String(formData.get("reason") ?? "").trim() || null;

  if (!talentId || !dueDate) {
    return { success: false, error: "Ein Fälligkeitsdatum ist erforderlich." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sitzung abgelaufen. Bitte erneut anmelden." };
  }

  const { error } = await supabase.from("reminders").insert({
    talent_id: talentId,
    created_by: user.id,
    due_date: dueDate,
    reason,
    status: "offen",
    is_system_generated: false,
  });

  if (error) {
    console.error("createReminder() fehlgeschlagen:", error.message);
    return { success: false, error: "Wiedervorlage konnte nicht gespeichert werden." };
  }

  revalidatePath(`/talents/${talentId}`);
  revalidatePath("/alerts-reminders");

  return { success: true };
}

// Manuelles Abschließen ohne begleitenden Bericht (z. B. "Talent wurde
// telefonisch bestätigt, kein neuer Bericht nötig"). Der automatische
// Abschluss über einen Bericht läuft weiterhin über createScoutReport.
export async function completeReminderManually(reminderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { error } = await supabase
    .from("reminders")
    .update({ status: "erledigt", completed_at: new Date().toISOString(), completed_by: user.id })
    .eq("id", reminderId)
    .in("status", ["offen", "ueberfaellig"]);

  if (error) {
    console.error("completeReminderManually() fehlgeschlagen:", error.message);
  }

  revalidatePath("/alerts-reminders");
}
