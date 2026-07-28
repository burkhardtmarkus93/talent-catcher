"use client";

import { useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { createScoutReport, type ScoutReportActionState } from "@/lib/actions/reports";

type Criterion = "technik" | "taktik" | "athletik" | "mentalitaet";

type TinderCriterion =
  | "trainingssensitivitaet"
  | "intelligenz"
  | "naturell"
  | "dynamik"
  | "erfolgsmotivation"
  | "resilienz";

const criteriaLabels: Record<Criterion, string> = {
  technik: "Technik",
  taktik: "Taktik",
  athletik: "Athletik",
  mentalitaet: "Mentalität",
};

const tinderLabels: Record<TinderCriterion, string> = {
  trainingssensitivitaet: "Trainingssensitivität",
  intelligenz: "Intelligenz im Spiel",
  naturell: "Naturell",
  dynamik: "Dynamik",
  erfolgsmotivation: "Erfolgsmotivation",
  resilienz: "Resilienz",
};

const initialState: ScoutReportActionState = { success: false };

export function ScoutReportForm({
  talentId,
  reminderId,
}: {
  talentId: string;
  reminderId?: string;
}) {
  const [state, formAction] = useFormState(createScoutReport, initialState);

  const [scores, setScores] = useState<Record<Criterion, number>>({
    technik: 3,
    taktik: 3,
    athletik: 3,
    mentalitaet: 3,
  });

  const [tinderScores, setTinderScores] = useState<Record<TinderCriterion, number>>({
    trainingssensitivitaet: 3,
    intelligenz: 3,
    naturell: 3,
    dynamik: 3,
    erfolgsmotivation: 3,
    resilienz: 3,
  });

  const [potenzial, setPotenzial] = useState<number>(2);
  const [reifegrad, setReifegrad] = useState<number>(0);

  const [overrideActive, setOverrideActive] = useState(false);
  const [overrideValue, setOverrideValue] = useState(3.0);
  const [overrideReason, setOverrideReason] = useState("");

  const calculatedRating = useMemo(() => {
    const sum = Object.values(scores).reduce((a, b) => a + b, 0);
    return Math.round((sum / 4) * 10) / 10;
  }, [scores]);

  const displayedRating = overrideActive ? overrideValue : calculatedRating;

  return (
    <form action={formAction} className="rounded-md border border-line bg-surface p-6">
      <input type="hidden" name="talentId" value={talentId} />
      {reminderId && <input type="hidden" name="reminderId" value={reminderId} />}

      <input type="hidden" name="scoreTechnik" value={scores.technik} />
      <input type="hidden" name="scoreTaktik" value={scores.taktik} />
      <input type="hidden" name="scoreAthletik" value={scores.athletik} />
      <input type="hidden" name="scoreMentalitaet" value={scores.mentalitaet} />

      <input
        type="hidden"
        name="tinderTrainingssensitivitaet"
        value={tinderScores.trainingssensitivitaet}
      />
      <input
        type="hidden"
        name="tinderIntelligenz"
        value={tinderScores.intelligenz}
      />
      <input
        type="hidden"
        name="tinderNaturell"
        value={tinderScores.naturell}
      />
      <input
        type="hidden"
        name="tinderDynamik"
        value={tinderScores.dynamik}
      />
      <input
        type="hidden"
        name="tinderErfolgsmotivation"
        value={tinderScores.erfolgsmotivation}
      />
      <input
        type="hidden"
        name="tinderResilienz"
        value={tinderScores.resilienz}
      />
      <input type="hidden" name="potenzial" value={potenzial} />
      <input type="hidden" name="reifegrad" value={reifegrad} />

      <input type="hidden" name="overrideActive" value={overrideActive ? "true" : "false"} />
      {overrideActive && (
        <>
          <input type="hidden" name="overrideValue" value={overrideValue} />
          <input type="hidden" name="overrideReason" value={overrideReason} />
        </>
      )}

      {state.error && (
        <div className="mb-4 rounded-sm border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {state.error}
        </div>
      )}

      {reminderId && (
        <p className="mb-4 rounded-sm bg-pitch-dim px-3 py-2 text-xs text-pitch-dark">
          Dieser Bericht schließt die zugehörige Wiedervorlage automatisch ab.
        </p>
      )}

      <div className="mb-6 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          Spieldatum
          <input
            type="date"
            name="matchDate"
            required
            className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          Gegner
          <input
            type="text"
            name="opponent"
            placeholder="z. B. SC Nachbarort"
            className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
          />
        </label>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        {(Object.keys(criteriaLabels) as Criterion[]).map((criterion) => (
          <div key={criterion} className="flex items-center justify-between">
            <span className="text-sm text-ink">{criteriaLabels[criterion]}</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() =>
                    setScores((prev) => ({ ...prev, [criterion]: value }))
                  }
                  className={`h-8 w-8 rounded-sm border text-sm font-mono transition-colors ${
                    scores[criterion] === value
                      ? "border-pitch bg-pitch text-white"
                      : "border-line bg-white text-ink hover:bg-pitch-dim"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-sm border border-line bg-paper p-4">
        <div className="mb-3">
          <p className="text-sm font-semibold text-ink">TINDER-Kriterien</p>
          <p className="text-xs text-muted">
            Zusätzliche Einschätzungsskalen von 1 bis 4. Sie beeinflussen das Gesamtrating
            nicht direkt, sondern liefern Kontext für spätere Auswertungen und die Risk-Engine.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {(Object.keys(tinderLabels) as TinderCriterion[]).map((criterion) => (
            <div key={criterion} className="flex items-center justify-between">
              <span className="text-sm text-ink">{tinderLabels[criterion]}</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((value) => (
                  <button
                    type="button"
                    key={value}
                    onClick={() =>
                      setTinderScores((prev) => ({ ...prev, [criterion]: value }))
                    }
                    className={`h-8 w-8 rounded-sm border text-sm font-mono transition-colors ${
                      tinderScores[criterion] === value
                        ? "border-pitch bg-pitch text-white"
                        : "border-line bg-white text-ink hover:bg-pitch-dim"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          Potenzial
          <select
            value={potenzial}
            onChange={(e) => setPotenzial(Number(e.target.value))}
            className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
          >
            <option value={1}>1 – hoch</option>
            <option value={2}>2 – überdurchschnittlich</option>
            <option value={3}>3 – durchschnittlich</option>
            <option value={4}>4 – unterdurchschnittlich</option>
          </select>
          <span className="text-xs text-muted">
            Allgemeine Potenzial-Skala, getrennt von der aktuellen Leistungsbewertung.
          </span>
        </label>

        <label className="flex flex-col gap-1.5 text-sm text-ink">
          Reifegrad
          <select
            value={reifegrad}
            onChange={(e) => setReifegrad(Number(e.target.value))}
            className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
          >
            <option value={-2}>-2 – Spätentwickler</option>
            <option value={-1}>-1 – eher spät entwickelt</option>
            <option value={0}>0 – altersgerecht</option>
            <option value={1}>+1 – eher früh entwickelt</option>
            <option value={2}>+2 – früh entwickelt</option>
          </select>
          <span className="text-xs text-muted">
            Biologischer Reifegrad relativ zum kalendarischen Alter.
          </span>
        </label>
      </div>

      <div className="mb-6 flex items-center justify-between rounded-sm bg-paper px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted">
            Gesamtrating {overrideActive ? "(manuell)" : "(wird bei Speichern berechnet)"}
          </p>
          <p className="font-mono text-2xl text-ink">{displayedRating.toFixed(1)}</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={overrideActive}
            onChange={(e) => setOverrideActive(e.target.checked)}
          />
          Manuell überschreiben
        </label>
      </div>

      {overrideActive && (
        <div className="mb-6 grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Manueller Wert
            <input
              type="number"
              min={1}
              max={5}
              step={0.1}
              value={overrideValue}
              onChange={(e) => setOverrideValue(parseFloat(e.target.value))}
              className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            Begründung (Pflichtfeld)
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="z. B. Einzelaktion überstrahlt Gesamtleistung"
              className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
            />
          </label>
        </div>
      )}

      <label className="mb-6 flex flex-col gap-1.5 text-sm text-ink">
        Kommentar
        <textarea
          name="comment"
          rows={4}
          placeholder="Freitext-Beobachtung..."
          className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
        />
      </label>

      <div className="flex justify-end gap-3">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Speichert..." : "Bericht speichern"}
    </Button>
  );
}
