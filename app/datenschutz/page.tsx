import Link from "next/link";
import { LogoLockup } from "@/components/ui/LogoLockup";

// ENTWURF — siehe Warnbanner unten. Bewusst nicht lokalisiert, gleiches
// Prinzip wie app/terms/page.tsx. Inhaltlich an der tatsächlichen
// Datenverarbeitung im Produkt ausgerichtet (Rollenmodell, Talent-/
// Gesundheitsdaten, Video-Uploads, Zahlungsabwicklung, Hosting) — siehe
// CLAUDE.md Kapitel 3 (Rollen-/Datenschutz zuerst) und Kapitel 8
// (rechtlich sensible Themen lieber zu vorsichtig als zu freizügig).
export default function DatenschutzPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-3 bg-paper px-4 py-12">
      <div className="w-full max-w-3xl rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">
            Datenschutzerklärung
          </h1>
        </div>

        <div className="mb-6 rounded-lg border border-brick/30 bg-brick/5 px-4 py-3 text-sm text-brick">
          <p className="font-medium">
            ENTWURF — noch nicht anwaltlich geprüft.
          </p>
          <p className="mt-1">
            Dieser Text wurde inhaltlich sorgfältig anhand der tatsächlich
            im Produkt verarbeiteten Daten erstellt, ersetzt aber keine
            anwaltliche/datenschutzrechtliche Prüfung. Er darf nicht als
            endgültige, rechtsverbindliche Datenschutzerklärung verwendet
            werden, bevor er geprüft und freigegeben wurde. Mit
            „[PLATZHALTER]“ gekennzeichnete Angaben fehlen noch.
          </p>
          <p className="mt-1 text-xs text-brick/80">
            DRAFT — not yet reviewed by a lawyer or data-protection
            professional. Grounded in the data actually processed by the
            product, but must still be reviewed before publication. Fields
            marked „[PLATZHALTER]“ are still missing.
          </p>
        </div>

        <div className="flex flex-col gap-6 text-sm text-ink">
          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              1. Verantwortlicher
            </h2>
            <p>
              Verantwortlicher im Sinne der Datenschutz-Grundverordnung
              (DSGVO) ist:
              <br />
              [PLATZHALTER: vollständiger Name/Firmierung]
              <br />
              [PLATZHALTER: ladungsfähige Anschrift]
              <br />
              E-Mail: burkhardt.markus93@gmail.com
              <br />
              (Kontaktdaten siehe auch{" "}
              <Link href="/impressum" className="underline-offset-2 hover:underline">
                Impressum
              </Link>
              .)
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              2. Datenschutzbeauftragte/r
            </h2>
            <p>
              [PLATZHALTER: Zu prüfen, ob nach § 38 BDSG die Pflicht zur
              Bestellung einer/eines Datenschutzbeauftragten besteht —
              insbesondere weil im Rahmen der Talentbeobachtung auch
              Gesundheitsdaten (Verletzungen, siehe Ziffer 5) als besondere
              Kategorien personenbezogener Daten nach Art. 9 DSGVO
              verarbeitet werden. Falls ja, hier Name und Kontaktdaten
              ergänzen.]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              3. Allgemeines zur Datenverarbeitung
            </h2>
            <p>
              Talent Catcher ist eine Software zur Beobachtung, Dokumentation
              und automatisierten Frühwarnung im Rahmen der Talentförderung
              im Nachwuchs- und Profifußball. Wir verarbeiten
              personenbezogene Daten nur, soweit dies für die
              Bereitstellung der Anwendung, zur Erfüllung vertraglicher
              Pflichten, aufgrund einer wirksamen Einwilligung oder
              aufgrund einer gesetzlichen Erlaubnis erforderlich ist. Die
              jeweilige Rechtsgrundlage ist bei den einzelnen
              Verarbeitungen unten angegeben.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              4. Bereitstellung der Anwendung, Server-Logdaten
            </h2>
            <p>
              Beim Aufruf der Anwendung erhebt unser Hosting-Anbieter
              automatisch technische Zugriffsdaten (u. a. IP-Adresse,
              Datum und Uhrzeit des Zugriffs, aufgerufene Adresse,
              verwendeter Browser). Diese Verarbeitung ist zum sicheren und
              stabilen Betrieb der Anwendung erforderlich (Art. 6 Abs. 1
              lit. f DSGVO, berechtigtes Interesse an Betriebssicherheit).
              [PLATZHALTER: konkrete Speicherdauer der Server-Logdaten beim
              Hosting-Anbieter angeben.]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              5. Nutzerkonten und Rollen
            </h2>
            <p className="mb-2">
              Zur Nutzung der Anwendung ist ein Nutzerkonto erforderlich. Je
              nach Rolle verarbeiten wir dabei: E-Mail-Adresse, Name,
              Vereins-/Verbandszugehörigkeit sowie — abhängig von der Rolle
              (Scout, Vereins-Admin, Landesverband-Betrachter,
              Erziehungsberechtigte/r, volljährige/r Spieler/in) —
              unterschiedliche Zugriffsrechte auf Talent-Daten. Diese
              Verarbeitung erfolgt zur Erfüllung des jeweiligen Nutzungs-
              bzw. Abonnementvertrags (Art. 6 Abs. 1 lit. b DSGVO).
            </p>
            <p>
              Nach dem Prinzip der Datensparsamkeit (siehe auch Ziffer 8)
              erhält jede Rolle ausschließlich die für ihre Funktion
              notwendigen Daten — z. B. sehen Landesverband-Nutzer nur
              freigegebene Basisprofile der ihnen zugeordneten Vereine,
              Erziehungsberechtigte/Spieler ausschließlich Daten des
              eigenen Kindes bzw. der eigenen Person.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              6. Talent-/Spielerdaten, einschließlich Minderjähriger
            </h2>
            <p className="mb-2">
              Über die Anwendung erfassen Vereine und Landesverbände Daten
              zu beobachteten Talenten, darunter Stammdaten (Name,
              Geburtsdatum, Position, Verein/Team), sportliche Bewertungen
              und Beobachtungsberichte, sowie optional Größe/Gewicht,
              Verletzungsangaben und Videomaterial. Ein erheblicher Teil
              dieser Personen ist minderjährig.
            </p>
            <p className="mb-2">
              <span className="font-medium">Rechtsgrundlage:</span> Soweit
              die Verarbeitung im Rahmen des Vertragsverhältnisses zwischen
              Verein und Talent-Catcher-Betreiber erfolgt, stützen wir uns
              auf das berechtigte Interesse des Vereins an der
              Talentbeobachtung im Rahmen seiner satzungsgemäßen Aufgaben
              (Art. 6 Abs. 1 lit. f DSGVO) sowie ergänzend auf
              Einwilligungen. Bei Minderjährigen unter 16 Jahren werden
              Einwilligungen ausschließlich von den Erziehungsberechtigten
              eingeholt (Art. 8 DSGVO); Minderjährige selbst können sich
              nicht eigenständig registrieren.
            </p>
            <p>
              <span className="font-medium">Verletzungs-/Gesundheitsdaten:</span>{" "}
              Angaben zu Verletzungen sind Gesundheitsdaten und damit eine
              besondere Kategorie personenbezogener Daten nach Art. 9
              DSGVO. Diese werden nur verarbeitet, wenn eine ausdrückliche
              Einwilligung der/des Betroffenen bzw. der Erziehungs-
              berechtigten vorliegt (Art. 9 Abs. 2 lit. a DSGVO). [PLATZHALTER:
              Einwilligungsprozess für Gesundheitsdaten anwaltlich prüfen —
              aktuell wird die Erfassung durch den Verein vorausgesetzt,
              ohne dass die Anwendung selbst eine gesonderte Einwilligung
              für diese Datenkategorie einholt.]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              7. Videomaterial
            </h2>
            <p>
              Videos werden ausschließlich hochgeladen, nachdem ein Verein
              gezielt ein Video angefordert hat, und bei minderjährigen
              Talenten nur, wenn zusätzlich eine dokumentierte Einwilligung
              der Erziehungsberechtigten für Videomaterial vorliegt
              (Art. 6 Abs. 1 lit. a, bei Minderjährigen i. V. m. Art. 8
              DSGVO). Videos werden in einem privaten, nicht öffentlich
              zugänglichen Speicherbereich abgelegt und sind ausschließlich
              für den betreuenden Verein sowie die hochladende Familie
              einsehbar.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              8. Weitergabe innerhalb der Anwendung
            </h2>
            <p>
              Eine Weitergabe von Talent-Daten erfolgt ausschließlich
              innerhalb des in der Anwendung angelegten Rollenmodells: der
              betreuende Verein, ggf. der zugeordnete Landesverband (nur
              freigegebene Basisdaten) sowie verknüpfte Erziehungs-
              berechtigte/volljährige Spieler für die eigenen Daten. Es
              findet keine automatisierte Vermittlung oder Kontaktaufnahme
              zwischen Vereinen, Trainern und Spielern/Eltern statt (siehe
              CLAUDE.md-Phasenmodell — diese Funktion ist bewusst nicht
              Teil des aktuellen Produkts).
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              9. Zahlungsabwicklung
            </h2>
            <p>
              Zahlungen (Vereins-/Verband-Abonnements sowie einmalige
              Registrierungs-/Zugriffsgebühren, siehe{" "}
              <Link href="/terms" className="underline-offset-2 hover:underline">
                AGB &amp; Widerrufsbelehrung
              </Link>
              ) wickeln wir über den Zahlungsdienstleister Stripe ab.
              Zahlungsdaten (z. B. Kreditkartendaten) werden ausschließlich
              von Stripe verarbeitet und nicht von uns gespeichert. Es kann
              dabei zu einer Übermittlung personenbezogener Daten
              (Name, E-Mail, Zahlungsbetrag) in die USA kommen; Stripe
              stellt hierfür geeignete Garantien bereit ([PLATZHALTER:
              genaue Grundlage prüfen — Standardvertragsklauseln und/oder
              EU-US Data Privacy Framework, je nach aktuellem Stand bei
              Stripe]). Näheres in der Datenschutzerklärung von Stripe.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              10. Hosting und technische Infrastruktur
            </h2>
            <p>
              Die Anwendung wird bei Vercel gehostet; Datenbank,
              Authentifizierung und Dateispeicher werden über Supabase
              betrieben (Serverstandort innerhalb der EU). Beide Anbieter
              werden als Auftragsverarbeiter im Sinne von Art. 28 DSGVO
              eingesetzt. [PLATZHALTER: Bestehen von
              Auftragsverarbeitungsverträgen bestätigen; bei Vercel als
              US-Unternehmen zusätzlich Übermittlungsgrundlage in
              Drittländer prüfen und hier ergänzen.]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              11. Cookies
            </h2>
            <p>
              Wir setzen ausschließlich technisch notwendige Cookies ein:
              einen Session-Cookie zur Anmeldung (erforderlich, damit Sie
              eingeloggt bleiben) sowie einen Cookie zur Speicherung Ihrer
              gewählten Sprache. Beide dienen ausschließlich dem Betrieb der
              Anwendung (Art. 6 Abs. 1 lit. f DSGVO bzw. § 25 Abs. 2 TTDSG).
              Wir setzen keine Analyse-, Tracking- oder Marketing-Cookies
              ein; eine Cookie-Einwilligung ist daher nach aktuellem Stand
              nicht erforderlich.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              12. Speicherdauer und Löschung
            </h2>
            <p>
              Wir speichern personenbezogene Daten nur so lange, wie dies
              für die jeweiligen Zwecke erforderlich ist oder wir gesetzlich
              zur Aufbewahrung verpflichtet sind. Vereine können für
              einzelne Talent-Profile ein Lösch-/Archivierungsdatum
              hinterlegen; eine automatisierte, fristauslösende Löschung
              findet aktuell nicht statt. [PLATZHALTER: konkrete
              Regel-Löschfristen je Datenkategorie festlegen — insbesondere
              für Daten zu abgelehnten Kandidaturen, inaktive Talent-Profile
              und Zahlungsdaten — und einen tatsächlichen Löschmechanismus
              ergänzen, bevor diese Ziffer final ist.]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              13. Ihre Rechte
            </h2>
            <p className="mb-2">
              Sie haben das Recht auf Auskunft über die zu Ihrer Person
              gespeicherten Daten (Art. 15 DSGVO), auf Berichtigung
              unrichtiger Daten (Art. 16 DSGVO), auf Löschung (Art. 17
              DSGVO), auf Einschränkung der Verarbeitung (Art. 18 DSGVO),
              auf Datenübertragbarkeit (Art. 20 DSGVO) sowie auf Widerspruch
              gegen die Verarbeitung (Art. 21 DSGVO). Erteilte
              Einwilligungen können Sie jederzeit mit Wirkung für die
              Zukunft widerrufen (Art. 7 Abs. 3 DSGVO).
            </p>
            <p className="mb-2">
              Bei Minderjährigen üben die Erziehungsberechtigten diese
              Rechte stellvertretend aus.
            </p>
            <p>
              Zur Ausübung dieser Rechte wenden Sie sich bitte an die unter
              Ziffer 1 genannten Kontaktdaten (siehe auch{" "}
              <Link href="/help" className="underline-offset-2 hover:underline">
                Hilfe &amp; Kontakt
              </Link>
              ).
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              14. Beschwerderecht bei einer Aufsichtsbehörde
            </h2>
            <p>
              Sie haben das Recht, sich bei einer Datenschutz-
              Aufsichtsbehörde zu beschweren. Zuständig ist in der Regel die
              Aufsichtsbehörde Ihres gewöhnlichen Aufenthalts oder die für
              den Verantwortlichen zuständige Behörde: [PLATZHALTER: Name
              und Anschrift der zuständigen Landesdatenschutzbehörde,
              abhängig vom Sitz des Verantwortlichen, ergänzen.]
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              15. Änderungen dieser Datenschutzerklärung
            </h2>
            <p>
              Wir passen diese Datenschutzerklärung an, sobald sich die
              Datenverarbeitung oder die Rechtslage ändert. Es gilt
              jeweils die zum Zeitpunkt Ihres Besuchs aktuelle, auf dieser
              Seite veröffentlichte Fassung.
            </p>
          </section>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/impressum" className="underline-offset-2 hover:underline">
            Impressum
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
