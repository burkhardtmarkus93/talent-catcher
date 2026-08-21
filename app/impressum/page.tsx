import Link from "next/link";
import { LogoLockup } from "@/components/ui/LogoLockup";

// ENTWURF — siehe Warnbanner unten. Bewusst nicht lokalisiert, gleiches
// Prinzip wie app/terms/page.tsx: Rechtstext, der erst nach anwaltlicher
// Prüfung und Ergänzung der [PLATZHALTER] final wird.
export default function ImpressumPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-3 bg-paper px-4 py-12">
      <div className="w-full max-w-2xl rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">
            Impressum
          </h1>
        </div>

        <div className="mb-6 rounded-lg border border-brick/30 bg-brick/5 px-4 py-3 text-sm text-brick">
          <p className="font-medium">
            ENTWURF — noch nicht vollständig und nicht anwaltlich geprüft.
          </p>
          <p className="mt-1">
            Mit „[PLATZHALTER]“ gekennzeichnete Angaben fehlen noch und
            müssen vor Live-Schaltung ergänzt werden — ein Impressum ohne
            diese Pflichtangaben ist nicht gesetzeskonform. Der Text ist
            zusätzlich vor Veröffentlichung anwaltlich zu prüfen.
          </p>
          <p className="mt-1 text-xs text-brick/80">
            DRAFT — incomplete and not yet reviewed by a lawyer. Fields
            marked „[PLATZHALTER]“ are still missing and must be filled in;
            an imprint without these mandatory details is not legally
            compliant.
          </p>
        </div>

        <div className="flex flex-col gap-6 text-sm text-ink">
          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Angaben gemäß § 5 DDG
            </h2>
            <p>
              [PLATZHALTER: vollständiger Name/Firmierung des Betreibers,
              ggf. Rechtsform]
              <br />
              [PLATZHALTER: ladungsfähige Anschrift — Straße, Hausnummer,
              PLZ, Ort]
              <br />
              [PLATZHALTER: falls juristische Person — vertretungsberechtigte
              Person(en)]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Kontakt
            </h2>
            <p>
              E-Mail: burkhardt.markus93@gmail.com
              <br />
              [PLATZHALTER: Telefonnummer, sofern für schnelle elektronische
              Kontaktaufnahme erforderlich]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Registereintrag / Umsatzsteuer
            </h2>
            <p>
              [PLATZHALTER: Handelsregister, Registergericht und
              Registernummer, falls vorhanden]
              <br />
              [PLATZHALTER: Umsatzsteuer-Identifikationsnummer gemäß § 27a
              UStG bzw. Hinweis auf Kleinunternehmerregelung § 19 UStG,
              falls zutreffend]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>
              [PLATZHALTER: nur erforderlich, falls journalistisch-
              redaktionelle Inhalte mit Meinungsbildungsrelevanz angeboten
              werden — bei einer reinen Scouting-/Verwaltungssoftware wie
              Talent Catcher im Regelfall nicht einschlägig; anwaltlich zu
              bestätigen.]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Streitschlichtung
            </h2>
            <p>
              [PLATZHALTER: Angabe, ob Bereitschaft zur Teilnahme an einem
              Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
              besteht, ggf. mit Name und Anschrift der zuständigen Stelle
              gemäß § 36 VSBG. Hinweis: Die frühere EU-Online-Streitbeilegungs
              (OS)-Plattform der EU-Kommission wurde zum 20. Juli 2025
              eingestellt — ein Verweis darauf ist nicht mehr aktuell und
              sollte nicht mehr verwendet werden.]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Haftung für Inhalte und Links
            </h2>
            <p>
              Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene
              Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
              verantwortlich. Nach §§ 8 bis 10 DDG sind wir als
              Diensteanbieter jedoch nicht verpflichtet, übermittelte oder
              gespeicherte fremde Informationen zu überwachen oder nach
              Umständen zu forschen, die auf eine rechtswidrige Tätigkeit
              hinweisen. Verpflichtungen zur Entfernung oder Sperrung der
              Nutzung von Informationen nach den allgemeinen Gesetzen
              bleiben hiervon unberührt.
            </p>
          </section>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/datenschutz" className="underline-offset-2 hover:underline">
            Datenschutzerklärung
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="underline-offset-2 hover:underline">
            AGB &amp; Widerrufsbelehrung
          </Link>{" "}
          ·{" "}
          <Link href="/help" className="underline-offset-2 hover:underline">
            Hilfe &amp; Kontakt
          </Link>
        </p>
      </div>
    </main>
  );
}
