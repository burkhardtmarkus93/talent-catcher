"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { createReminder, type ReminderActionState } from "@/lib/actions/reminders";

const initialState: ReminderActionState = { success: false };

// Bewusst minimal: kein Datepicker-Widget, keine Intervall-Vorschläge —
// nur Datum + optionaler Grund. Systemgenerierte Intervall-Logik bleibt
// dem Nachtjob vorbehalten (nicht Teil dieses Prototyps).
export function ReminderForm({ talentId }: { talentId: string }) {
  const [state, formAction] = useFormState(createReminder, initialState);
  const [open, setOpen] = useState(false);

  if (state.success) {
    return (
      <p className="rounded-sm bg-pitch-dim px-3 py-2 text-sm text-pitch-dark">
        Wiedervorlage gespeichert.
      </p>
    );
  }

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        Wiedervorlage setzen
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-sm border border-line bg-paper p-3">
      <input type="hidden" name="talentId" value={talentId} />
      {state.error && <p className="text-xs text-brick">{state.error}</p>}
      <label className="flex flex-col gap-1 text-xs text-muted">
        Fällig am
        <input
          type="date"
          name="dueDate"
          required
          className="rounded-sm border border-line px-2 py-1 text-sm text-ink"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-muted">
        Grund (optional)
        <input
          type="text"
          name="reason"
          className="rounded-sm border border-line px-2 py-1 text-sm text-ink"
        />
      </label>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="mt-1">
      {pending ? "Speichert..." : "Speichern"}
    </Button>
  );
}
