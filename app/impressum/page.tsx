import Link from "next/link";
import { LogoLockup } from "@/components/ui/LogoLockup";

// ENTWURF — siehe Warnbanner unten. Bewusst nicht lokalisiert, gleiches
// Prinzip wie app/terms/page.tsx: Rechtstext, der erst nach anwaltlicher
// Prüfung final wird.
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
            ENTWURF — noch nicht anwaltlich geprüft.
          </p>
          <p className="mt-1">
            Alle Pflichtangaben sind ausgefüllt. Der Text ist dennoch vor
            Veröffentlichung anwaltlich zu prüfen — insbesondere die
            steuerliche Einordnung (Kleinunternehmerregelung im Rahmen der
            freiberuflichen Tätigkeit des Betreibers) sollte bei
            wachsenden Umsätzen regelmäßig mit dem Finanzamt/Steuerberater
            neu abgestimmt werden.
          </p>
          <p className="mt-1 text-xs text-brick/80">
            DRAFT — all mandatory details are filled in. Still needs
            review by a lawyer before publication; the tax classification
            (small-business exemption under the operator's freelance
            registration) should be re-checked with a tax advisor as
            revenue grows.
          </p>
        </div>

        <div className="flex flex-col gap-6 text-sm text-ink">
          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Angaben gemäß § 5 DDG
            </h2>
            <p>
              Markus Burkhardt
              <br />
              Gartenstraße 9
              <br />
              72280 Dornstetten
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Kontakt
            </h2>
            <p>
              E-Mail: burkhardt.markus93@gmail.com
              <br />
              Instagram (ergänzender, nicht verpflichtender Kontaktweg):
              @markusbkdt
              <br />
              Eine Telefonnummer wird nicht angeboten; die elektronische
              Kontaktaufnahme erfolgt per E-Mail.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Registereintrag / Umsatzsteuer
            </h2>
            <p>
              Einzelunternehmer, kein Handelsregistereintrag.
              <br />
              Talent Catcher wird im Rahmen derselben freiberuflichen
              Tätigkeit betrieben wie das übrige Trainer-/Coaching-Angebot
              des Betreibers. Es wird von der Kleinunternehmerregelung
              gemäß § 19 UStG Gebrauch gemacht; Umsatzsteuer wird nicht
              ausgewiesen, eine Umsatzsteuer-Identifikationsnummer liegt
              dementsprechend nicht vor.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
            </h2>
            <p>
              Nicht einschlägig — Talent Catcher ist eine reine Scouting-
              und Verwaltungssoftware ohne journalistisch-redaktionelle
              Inhalte mit Meinungsbildungsrelevanz.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Streitschlichtung
            </h2>
            <p>
              Wir sind nicht bereit und nicht verpflichtet, an einem
              Streitbeilegungsverfahren vor einer
              Verbraucherschlichtungsstelle nach § 36 VSBG teilzunehmen.
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
