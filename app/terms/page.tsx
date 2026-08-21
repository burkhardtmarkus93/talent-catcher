import Link from "next/link";
import { LogoLockup } from "@/components/ui/LogoLockup";

// ENTWURF — siehe Warnbanner unten. Bewusst NICHT über messages/*.json
// lokalisiert (anders als der Rest der Seite): das ist Rechtstext, der
// laut PR-Vorgabe ohnehin vollständig durch eine anwaltlich geprüfte
// Fassung ersetzt werden muss, bevor er live geht — eine 5-sprachige
// Übersetzung von Text, der ersetzt wird, wäre verschwendeter Aufwand.
// Gleiches Prinzip wie planNameDe()/planTaglineDe() in lib/plans.ts für
// bewusst nicht lokalisierte Inhalte.
export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-3 bg-paper px-4 py-12">
      <div className="w-full max-w-2xl rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">
            AGB &amp; Widerrufsbelehrung
          </h1>
        </div>

        <div className="mb-6 rounded-lg border border-brick/30 bg-brick/5 px-4 py-3 text-sm text-brick">
          <p className="font-medium">
            ENTWURF — nicht rechtsverbindlich geprüft.
          </p>
          <p className="mt-1">
            Dieser Text ist ein technischer Platzhalter und wurde nicht von
            einer Rechtsanwältin/einem Rechtsanwalt geprüft. Er darf nicht als
            endgültige Vertragsgrundlage verwendet werden, bevor er
            anwaltlich geprüft und freigegeben wurde.
          </p>
          <p className="mt-1 text-xs text-brick/80">
            DRAFT — not legally reviewed. This page is a technical
            placeholder pending review by a lawyer and must not be used as
            the final contract basis before that review is complete.
          </p>
        </div>

        <div className="flex flex-col gap-5 text-sm text-ink">
          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 1 Geltungsbereich, Vertragspartner
            </h2>
            <p>
              Diese Bedingungen gelten für die kostenpflichtige Registrierung
              eines Spielers als Kandidat bei einem Verein über das
              Registrierungsformular von Talent Catcher. Vertragspartner ist
              der Betreiber von Talent Catcher.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 2 Vertragsgegenstand
            </h2>
            <p>
              Gegen die einmalige Gebühr wird die eingereichte Bewerbung
              erfasst und dem gewählten Verein zur Prüfung vorgelegt. Die
              Zahlung ist eine Bearbeitungsgebühr für die Erfassung und
              Weiterleitung der Bewerbung — sie ist keine Garantie oder
              Zusicherung, dass der Verein die Bewerbung annimmt oder den
              Spieler als Talent aufnimmt.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 3 Preis und Zahlung
            </h2>
            <p>
              Der Preis wird vor der Zahlung im Registrierungsformular
              angezeigt. Es handelt sich um eine einmalige Zahlung, kein
              Abonnement. Die Zahlungsabwicklung erfolgt über Stripe.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 4 Beginn der Leistung vor Ablauf der Widerrufsfrist
            </h2>
            <p>
              Mit Bestätigung der Zahlung erklären Sie sich ausdrücklich
              damit einverstanden, dass mit der Bearbeitung Ihrer Bewerbung
              (Erfassung und Weiterleitung an den gewählten Verein) bereits
              vor Ablauf der Widerrufsfrist begonnen wird.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              Widerrufsbelehrung
            </h2>
            <p className="mb-2 font-medium">Widerrufsrecht</p>
            <p>
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von
              Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist
              beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
            </p>
            <p className="mt-2">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Kontaktdaten
              siehe{" "}
              <Link href="/help" className="underline-offset-2 hover:underline">
                Hilfe &amp; Kontakt
              </Link>
              ) mittels einer eindeutigen Erklärung (z. B. per E-Mail) über
              Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
            </p>
            <p className="mt-2 font-medium">Erlöschen des Widerrufsrechts</p>
            <p>
              Ihr Widerrufsrecht erlischt vorzeitig, wenn wir die Bearbeitung
              Ihrer Bewerbung vollständig erbracht haben, das heißt sobald
              die Bewerbung dem gewählten Verein zur Prüfung vorgelegt wurde,
              und Sie vorher ausdrücklich zugestimmt haben, dass wir mit der
              Bearbeitung vor Ablauf der Widerrufsfrist beginnen (siehe § 4).
            </p>
            <p className="mt-2 font-medium">Folgen des Widerrufs</p>
            <p>
              Wenn Sie diesen Vertrag widerrufen, erstatten wir Ihnen alle
              Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und
              spätestens binnen vierzehn Tagen ab dem Tag, an dem die
              Mitteilung über Ihren Widerruf bei uns eingegangen ist.
            </p>
          </section>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/help" className="underline-offset-2 hover:underline">
            Hilfe &amp; Kontakt
          </Link>
        </p>
      </div>
    </main>
  );
}
