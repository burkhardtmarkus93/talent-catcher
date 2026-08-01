import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getTalentById } from "@/lib/queries/talents";
import { createGkCoordinationTest } from "@/lib/actions/gkTests";

export default async function NewGkCoordinationTestPage({
  params,
  searchParams,
}: {
  params: { talentId: string };
  searchParams: { error?: string };
}) {
  const talent = await getTalentById(params.talentId);
  if (!talent || talent.primaryPosition !== "TW") notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href={`/talents/${talent.id}`}
        className="text-sm text-muted hover:underline"
      >
        ← Zurück zu {talent.firstName} {talent.lastName}
      </Link>

      <PageHeader
        title="Koordinationstest erfassen"
        subtitle="Eigenständiges Torwart-Koordinationsmodul — Altersklasse wird automatisch aus Jahrgang und Testdatum abgeleitet."
      />

      {searchParams.error && (
        <p className="mt-4 rounded-sm border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          {searchParams.error}
        </p>
      )}

      <form action={createGkCoordinationTest} className="mt-6 flex flex-col gap-4">
        <input type="hidden" name="talentId" value={talent.id} />

        <label className="flex flex-col gap-1.5 text-sm text-ink">
          Testdatum
          <input
            type="date"
            name="testDate"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
          />
        </label>

        <ScoreField name="scoreWechselwurf" label="Wechselwurf mit Reaktionssignal" />
        <ScoreField name="scoreKreuzprellen" label="Kreuzprellen mit Handwechsel-Signal" />
        <ScoreField name="scoreWandreaktion" label="Wand-Reaktionswurf mit variabler Distanz" />
        <ScoreField name="scoreDoppelwandwurf" label="Doppel-Wandwurf mit Kreuzfang" />
        <ScoreField name="scoreWurfdrehung" label="Wurf-Drehung-Fang (0–3 Punkte)" max={3} />
        <ScoreField name="scoreDoppeldrehung" label="Doppeldrehung mit Bodenkontakt" />

        <Button type="submit" className="w-full">
          Test speichern
        </Button>
      </form>
    </div>
  );
}

function ScoreField({
  name,
  label,
  max,
}: {
  name: string;
  label: string;
  max?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm text-ink">
      {label}
      <input
        type="number"
        name={name}
        min={0}
        max={max}
        className="rounded-sm border border-line px-3 py-2 text-sm outline-none focus:border-pitch"
      />
    </label>
  );
}
