"use client";

import { useSearchParams } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { createTalent, type TalentActionState } from "@/lib/actions/talents";

const initialState: TalentActionState = { success: false };

export function NewTalentForm() {
  const [state, formAction] = useFormState(createTalent, initialState);
  const searchParams = useSearchParams();
  const prefillFirstName = searchParams.get("firstName") ?? "";
  const prefillLastName = searchParams.get("lastName") ?? "";
  const prefillBirthDate = searchParams.get("birthDate") ?? "";
  const t = useTranslations("newTalentForm");

  return (
    <form action={formAction} className="rounded-xl border border-line bg-surface p-6">
      {state.error && (
        <div className="mb-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {state.error}
        </div>
      )}
      {prefillFirstName && (
        <div className="mb-4 rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-2 text-sm text-pitch">
          {t("prefillNotice")}
        </div>
      )}
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label={t("firstName")} name="firstName" required defaultValue={prefillFirstName} />
        <Field label={t("lastName")} name="lastName" required defaultValue={prefillLastName} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field
          label={t("birthDate")}
          name="birthDate"
          type="date"
          required
          defaultValue={prefillBirthDate}
        />
        <Field label={t("primaryPosition")} name="primaryPosition" placeholder={t("primaryPositionPlaceholder")} required />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label={t("secondaryPosition")} name="secondaryPosition" />
        <div>
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            {t("contractStatus")}
            <select
              name="contractStatus"
              defaultValue="unbekannt"
              className="select-field"
            >
              <option value="unbekannt">{t("contractStatusUnbekannt")}</option>
              <option value="aktiv">{t("contractStatusAktiv")}</option>
              <option value="auslaufend">{t("contractStatusAuslaufend")}</option>
              <option value="vereinslos">{t("contractStatusVereinslos")}</option>
            </select>
          </label>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label={t("clubNameText")} name="clubNameText" />
        <Field label={t("teamNameText")} name="teamNameText" placeholder={t("teamNameTextPlaceholder")} />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label={t("leagueText")} name="leagueText" />
        <Field label={t("countryText")} name="countryText" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label={t("heightCm")} name="heightCm" type="number" />
        <Field label={t("weightKg")} name="weightKg" type="number" />
      </div>
      <div className="mb-6">
        <Field label={t("contractEndDate")} name="contractEndDate" type="date" />
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
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink">
      {label}
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="field"
      />
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("newTalentForm");
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("saving") : t("submit")}
    </Button>
  );
}
