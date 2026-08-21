"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import {
  submitTalentCandidate,
  type CandidateActionState,
} from "@/lib/actions/candidates";
import { CANDIDATE_REGISTRATION_PRICE_EUR } from "@/lib/candidatePricing";
import { formatEuro } from "@/lib/plans";
import type { PublicClubOption } from "@/lib/types";

const initialState: CandidateActionState = { success: false };

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;
  const diff = Date.now() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

// Torwart-Akademie (https://torwart-akademie.vercel.app/) ist ein
// eigenständiges, separates Projekt für TW-Talente — nur ein
// informativer Hinweis, keine Einschränkung der Bewerbung hier (mit
// dem Projektverantwortlichen abgestimmt).
const GOALKEEPER_PATTERN = /\b(tw|gk|torwart|torh[üu]ter|goalkeeper|keeper)\b/i;
const TORWART_AKADEMIE_URL = "https://torwart-akademie.vercel.app/";

export function CandidateRegistrationForm({ clubs }: { clubs: PublicClubOption[] }) {
  const [state, formAction] = useFormState(submitTalentCandidate, initialState);
  const [birthDate, setBirthDate] = useState("");
  const [primaryPosition, setPrimaryPosition] = useState("");
  const t = useTranslations("candidateRegistrationPage");

  const age = useMemo(() => calculateAge(birthDate), [birthDate]);
  const isMinor = age !== null && age < 18;
  const isGoalkeeper = GOALKEEPER_PATTERN.test(primaryPosition.trim());

  return (
    <form action={formAction} className="rounded-xl border border-line bg-surface p-6">
      {state.error && (
        <div className="mb-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {state.error}
        </div>
      )}

      <div className="mb-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          {t("club")}
          <select name="clubId" required defaultValue="" className="select-field">
            <option value="" disabled>
              {t("clubPlaceholder")}
            </option>
            {clubs.map((club) => (
              <option key={club.id} value={club.id}>
                {club.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <Field label={t("firstName")} name="firstName" required />
        <Field label={t("lastName")} name="lastName" required />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          {t("birthDate")}
          <input
            type="date"
            name="birthDate"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.currentTarget.value)}
            className="field"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          {t("primaryPosition")}
          <input
            type="text"
            name="primaryPosition"
            required
            placeholder={t("primaryPositionPlaceholder")}
            value={primaryPosition}
            onChange={(e) => setPrimaryPosition(e.currentTarget.value)}
            className="field"
          />
        </label>
      </div>

      {isGoalkeeper && (
        <div className="mb-4 rounded-lg border border-line bg-paper p-3">
          <p className="text-sm text-ink">{t("goalkeeperHint")}</p>
          <a
            href={TORWART_AKADEMIE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-pitch underline-offset-2 hover:underline"
          >
            {t("goalkeeperLink")}
          </a>
        </div>
      )}

      {isMinor && (
        <div className="mb-4 rounded-lg border border-line bg-paper p-3">
          <p className="text-sm text-ink">{t("guardianHint")}</p>
        </div>
      )}

      <div className="mb-4">
        <Field
          label={isMinor ? t("contactEmailGuardian") : t("contactEmail")}
          name="contactEmail"
          type="email"
          placeholder={t("contactEmailPlaceholder")}
          required
        />
      </div>

      <div className="mb-4 rounded-lg border border-line bg-paper p-3">
        <p className="text-sm text-ink">
          {t("paymentHint", { price: formatEuro(CANDIDATE_REGISTRATION_PRICE_EUR) })}
        </p>
      </div>

      <label className="mb-3 flex items-start gap-2 text-sm text-ink">
        <input type="checkbox" name="dataConsent" required className="mt-0.5" />
        {isMinor ? t("dataConsentGuardian") : t("dataConsent")}
      </label>

      <label className="mb-6 flex items-start gap-2 text-sm text-ink">
        <input type="checkbox" name="termsAccepted" required className="mt-0.5" />
        {t.rich("termsConsent", {
          terms: (chunks) => (
            <Link href="/terms" target="_blank" className="underline-offset-2 hover:underline">
              {chunks}
            </Link>
          ),
        })}
      </label>

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
  const t = useTranslations("candidateRegistrationPage");
  return (
    <Button type="submit" disabled={pending}>
      {pending ? t("submitting") : t("submitToPayment")}
    </Button>
  );
}
