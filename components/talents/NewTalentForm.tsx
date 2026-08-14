"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { createTalent, type TalentActionState } from "@/lib/actions/talents";

const initialState: TalentActionState = { success: false };

export function NewTalentForm() {
  const [state, formAction] = useFormState(createTalent, initialState);

  return (
    <form action={formAction} className="rounded-md border border-line bg-surface p-6">
      {state.error && (
        <div className="mb-4 rounded-sm border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {state.error}
        </div>
      )}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label="Vorname *" name="firstName" required />
        <Field label="Nachname *" name="lastName" required />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label="Geburtsdatum *" name="birthDate" type="date" required />
        <Field label="Hauptposition *" name="primaryPosition" placeholder="z. B. IV, TW, ST" required />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label="Nebenposition" name="secondaryPosition" />
        <div>
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Vertragsstatus
            <select
              name="contractStatus"
              defaultValue="unbekannt"
              className="select-field"
            >
              <option value="unbekannt">Unbekannt</option>
              <option value="aktiv">Aktiv</option>
              <option value="auslaufend">Auslaufend</option>
              <option value="vereinslos">Vereinslos</option>
            </select>
          </label>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label="Aktueller Verein" name="clubNameText" />
        <Field label="Team/Jahrgang" name="teamNameText" placeholder="z. B. U17" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label="Liga" name="leagueText" />
        <Field label="Land" name="countryText" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label="Körpergröße (cm)" name="heightCm" type="number" />
        <Field label="Gewicht (kg)" name="weightKg" type="number" />
      </div>
      <div className="mb-6">
        <Field label="Vertragsende (falls bekannt)" name="contractEndDate" type="date" />
      </div>
      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink">
      {label}
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="field"
      />
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Speichert..." : "Talent anlegen"}
    </Button>
  );
}
