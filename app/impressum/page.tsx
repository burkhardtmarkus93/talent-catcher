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
            ENTWURF — noch nicht anwaltlich geprüft.
          </p>
          <p className="mt-1">
            Die Betreiberangaben sind ausgefüllt. Mit „[PLATZHALTER]“
            gekennzeichnete Angaben betreffen offene Geschäfts-/
            Steuerfragen (siehe Registereintrag/Umsatzsteuer) und fehlen
            noch — der Text ist zusätzlich vor Veröffentlichung anwaltlich
            zu prüfen.
          </p>
          <p className="mt-1 text-xs text-brick/80">
            DRAFT — operator details filled in; fields marked
            „[PLATZHALTER]“ mark open tax/business-registration questions
            still to be confirmed. Must still be reviewed by a lawyer
            before publication.
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
              [PLATZHALTER: Umsatzsteuer-Identifikationsnummer gemäß § 27a
              UStG bzw. Hinweis auf Kleinunternehmerregelung § 19 UStG —
              abhängig davon, ob der Betrieb von Talent Catcher unter
              dieselbe steuerliche Einordnung fällt wie die separate
              freiberufliche Sporttrainer-/Videocoaching-Tätigkeit oder
              eigenständig zu behandeln ist; mit Finanzamt/Steuerberater zu
              klären.]
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
