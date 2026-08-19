"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { createReminder, type ReminderActionState } from "@/lib/actions/reminders";

const initialState: ReminderActionState = { success: false };

// Bewusst minimal: kein Datepicker-Widget, keine Intervall-Vorschläge —
// nur Datum + optionaler Grund. Systemgenerierte Intervall-Logik bleibt
// dem Nachtjob vorbehalten (nicht Teil dieses Prototyps).
export function ReminderForm({ talentId }: { talentId: string }) {
  const [state, formAction] = useFormState(createReminder, initialState);
  const [open, setOpen] = useState(false);
  const t = useTranslations("reminderForm");

  if (state.success) {
    return (
      <p className="rounded-lg bg-pitch-dim px-3 py-2 text-sm text-pitch-dark">
        {t("saved")}
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        {t("setReminder")}
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-lg border border-line bg-paper p-3">
      <input type="hidden" name="talentId" value={talentId} />
      {state.error && <p className="text-xs text-brick">{state.error}</p>}
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t("dueDate")}
        <input
          type="date"
          name="dueDate"
          required
          className="field"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        {t("reason")}
        <input
          type="text"
          name="reason"
          className="field"
        />
      </label>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("reminderForm");
  return (
    <Button type="submit" disabled={pending} className="mt-1">
      {pending ? t("saving") : t("save")}
    </Button>
  );
}
