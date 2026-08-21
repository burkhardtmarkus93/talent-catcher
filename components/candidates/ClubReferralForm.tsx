"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  submitClubReferral,
  type ClubReferralActionState,
} from "@/lib/actions/clubReferral";

const initialState: ClubReferralActionState = { success: false };

export function ClubReferralForm() {
  const [state, formAction] = useFormState(submitClubReferral, initialState);
  const t = useTranslations("clubReferralPage");

  if (state.success) {
    return (
      <div className="rounded-xl border border-pitch/30 bg-pitch/5 p-6 text-sm text-pitch-dark">
        <p className="font-medium">{t("successTitle")}</p>
        <p className="mt-1.5 text-pitch-dark/80">{t("successBody")}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="rounded-xl border border-line bg-surface p-6">
      {state.error && (
        <div className="mb-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {state.error}
        </div>
      )}

      <div className="mb-4">
        <Field label={t("referredClubName")} name="referredClubName" required />
      </div>
      <div className="mb-4">
        <Field
          label={t("referredClubContactEmail")}
          name="referredClubContactEmail"
          type="email"
          placeholder={t("referredClubContactEmailPlaceholder")}
        />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label={t("referrerName")} name="referrerName" required />
        <Field label={t("referrerEmail")} name="referrerEmail" type="email" required />
      </div>
      <div className="mb-6">
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          {t("note")}
          <textarea name="note" rows={3} className="field" placeholder={t("notePlaceholder")} />
        </label>
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
  const t = useTranslations("clubReferralPage");
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("submitting") : t("submit")}
    </Button>
  );
}
