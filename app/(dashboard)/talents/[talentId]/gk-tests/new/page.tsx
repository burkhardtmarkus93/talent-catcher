"use client";

import React, { useState } from "react";

type TestField = {
  key: string;
  label: string;
};

const tests: TestField[] = [
  { key: "wechselwurf", label: "Wechselwurf mit Reaktionssignal" },
  { key: "kreuzprellen", label: "Kreuzprellen mit Handwechsel-Signal" },
  { key: "wandreaktion", label: "Wand-Reaktionswurf mit variabler Distanz" },
  { key: "doppelwand", label: "Doppel-Wandwurf mit Kreuzfang" },
  { key: "wurfdrehung", label: "Wurf-Drehung-Fang" },
  { key: "doppeldrehung", label: "Doppel-Drehung mit Bodenkontakt" },
];

const scoreHelp =
  "0 = reagiert kaum auf Signale, Würfe unkontrolliert. 1 = reagiert, aber häufig falsch oder sehr langsam. 2 = überwiegend richtige Reaktion, Tempo ok, vereinzelt Fehler. 3 = schnelle, richtige Reaktion, kontrollierte Würfe, flüssiger Ablauf.";

function InfoIcon({ text }: { text: string }) {
  return (
    <span className="relative group inline-flex items-center ml-2 cursor-help align-middle">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-green-800 text-xs font-bold text-green-800 bg-white">
        i
      </span>
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-80 -translate-x-1/2 rounded-md bg-gray-900 px-3 py-2 text-sm text-white shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  );
}

export default function CoordinationTestForm() {
  const [values, setValues] = useState<Record<string, string>>({
    testdatum: "01.08.2026",
    wechselwurf: "",
    kreuzprellen: "",
    wandreaktion: "",
    doppelwand: "",
    wurfdrehung: "",
    doppeldrehung: "",
  });

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(values);
  };

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <a href="#" className="text-sm text-green-800 hover:underline">
          ← Zurück
        </a>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">
          Koordinationstest erfassen
        </h1>
        <p className="mt-2 text-gray-600">
          Eigenständiges Torwart-Koordinationsmodul — Altersklasse wird automatisch aus Jahrgang und Testdatum abgeleitet.
        </p>
      </div>

      <div className="mb-6 rounded-md border border-gray-200 bg-green-50 p-4 text-sm text-gray-800">
        <div className="font-medium">Bewertung je Übung: 0–3 Punkte</div>
        <div className="mt-1">
          <span className="font-medium">0</span> = reagiert kaum auf Signale, Würfe unkontrolliert.
          <br />
          <span className="font-medium">1</span> = reagiert, aber häufig falsch oder sehr langsam.
          <br />
          <span className="font-medium">2</span> = überwiegend richtige Reaktion, Tempo ok, vereinzelt Fehler.
          <br />
          <span className="font-medium">3</span> = schnelle, richtige Reaktion, kontrollierte Würfe, flüssiger Ablauf.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-800" htmlFor="testdatum">
            Testdatum
          </label>
          <input
            id="testdatum"
            type="text"
            value={values.testdatum}
            onChange={(e) => handleChange("testdatum", e.target.value)}
            className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-green-700"
          />
        </div>

        {tests.map((test) => (
          <div key={test.key}>
            <label className="mb-2 flex items-center text-sm font-medium text-gray-800" htmlFor={test.key}>
              {test.label}
              <span className="ml-1 text-gray-500">(0–3 Punkte)</span>
              <InfoIcon text={scoreHelp} />
            </label>
            <input
              id={test.key}
              type="number"
              min={0}
              max={3}
              step={1}
              inputMode="numeric"
              placeholder="Punkte eingeben"
              value={values[test.key]}
              onChange={(e) => handleChange(test.key, e.target.value)}
              className="w-full rounded-md border border-gray-300 px-4 py-3 outline-none focus:border-green-700"
            />
            <div className="mt-1 text-xs text-gray-500">Nur Werte von 0 bis 3 erlaubt.</div>
          </div>
        ))}

        <button
          type="submit"
          className="w-full rounded-md bg-green-800 px-4 py-3 font-medium text-white hover:bg-green-900"
        >
          Test speichern
        </button>
      </form>
    </div>
  );
}
