import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getTalentById } from "@/lib/queries/talents";
import { getKoordinationstestDocUrl } from "@/lib/queries/documents";
import { createGkCoordinationTest } from "@/lib/actions/gkTests";

const TESTS: { name: string; label: string }[] = [
  { name: "scoreWechselwurf", label: "Wechselwurf mit Reaktionssignal" },
  { name: "scoreKreuzprellen", label: "Kreuzprellen mit Handwechsel-Signal" },
  { name: "scoreWandreaktion", label: "Wand-Reaktionswurf mit variabler Distanz" },
  { name: "scoreDoppelwandwurf", label: "Doppel-Wandwurf mit Kreuzfang" },
  { name: "scoreWurfdrehung", label: "Wurf-Drehung-Fang" },
  { name: "scoreDoppeldrehung", label: "Doppel-Drehung mit Bodenkontakt" },
];

export default async function GKTestNewPage({
  params,
  searchParams,
}: {
  params: { talentId: string };
  searchParams: { error?: string };
}) {
  const talent = await getTalentById(params.talentId);
  if (!talent) notFound();

  const docUrl = await getKoordinationstestDocUrl();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/talents/${talent.id}`}
        className="text-sm text-muted hover:underline"
      >
        ← Zurück zu {talent.firstName} {talent.lastName}
      </Link>

      <h1 className="mt-2 font-display text-2xl font-medium text-ink">
        Koordinationstest erfassen
      </h1>
      <p className="mt-2 text-sm text-muted">
        Eigenständiges Torwart-Koordinationsmodul — Altersklasse wird
        automatisch aus Jahrgang und Testdatum abgeleitet.
      </p>

      {searchParams.error && (
        <div className="mt-4 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {decodeURIComponent(searchParams.error)}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-line bg-pitch-dim p-4 text-sm text-ink">
        <div className="font-medium">Bewertung je Test: 0–3 Punkte</div>
        <div className="mt-1 text-muted">
          <span className="font-medium text-ink">0</span> = reagiert kaum auf
          Signale, Würfe unkontrolliert.
          <br />
          <span className="font-medium text-ink">1</span> = reagiert, aber
          häufig falsch oder sehr langsam.
          <br />
          <span className="font-medium text-ink">2</span> = überwiegend
          richtige Reaktion, Tempo ok, vereinzelt Fehler.
          <br />
          <span className="font-medium text-ink">3</span> = schnelle,
          richtige Reaktion, kontrollierte Würfe, flüssiger Ablauf.
        </div>
      </div>

      {docUrl && (
        <div className="mt-6">
          <a href={docUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary">Word-Datei herunterladen</Button>
          </a>
          <p className="mt-2 text-xs text-muted">
            Öffnet die Test-Word-Datei mit allen Beschreibungen und der
            Punkteskala (Link eine Stunde gültig).
          </p>
        </div>
      )}

      <form
        action={createGkCoordinationTest}
        className="mt-6 flex flex-col gap-5 rounded-xl border border-line bg-surface p-5"
      >
        <input type="hidden" name="talentId" value={talent.id} />
        <label className="flex flex-col gap-1.5 text-sm text-ink">
          Testdatum
          <input
            type="date"
            name="testDate"
            defaultValue={today}
            required
            className="field"
          />
        </label>

        {TESTS.map((t) => (
          <label key={t.name} className="flex flex-col gap-1.5 text-sm text-ink">
            {t.label} <span className="font-normal text-muted">(0–3 Punkte)</span>
            <input
              type="number"
              name={t.name}
              min={0}
              max={3}
              step={1}
              inputMode="numeric"
              placeholder="Punkte eingeben"
              className="field"
            />
          </label>
        ))}

        <Button type="submit">Test speichern</Button>
      </form>
    </div>
  );
}
