import Link from "next/link";
import { LogoLockup } from "@/components/ui/LogoLockup";

// ENTWURF — siehe Warnbanner unten. Bewusst NICHT über messages/*.json
// lokalisiert (anders als der Rest der Seite): das ist Rechtstext, der
// laut PR-Vorgabe ohnehin erst nach anwaltlicher Prüfung endgültig
// freigegeben wird — eine 5-sprachige Übersetzung von Text, der sich
// nach der Prüfung noch ändern kann, wäre verschwendeter Aufwand.
// Gleiches Prinzip wie planNameDe()/planTaglineDe() in lib/plans.ts für
// bewusst nicht lokalisierte Inhalte.
//
// Inhaltlich deckt dieser Entwurf die drei aktuell im Produkt
// existierenden Zahlungsarten ab (siehe lib/plans.ts, lib/candidatePricing.ts,
// lib/actions/billing.ts, lib/actions/candidates.ts):
//   1) Vereins-/Verband-Abonnement (wiederkehrend, Vertragspartner ist ein
//      Verein/Verband als Unternehmer i.S.d. § 14 BGB — daher KEIN
//      verbraucherrechtliches Widerrufsrecht, § 312g Abs. 1 BGB).
//   2) Einmalige Registrierungsgebühr für ein Talent (durch
//      Erziehungsberechtigte für ein minderjähriges Kind oder durch eine
//      volljährige Person für sich selbst) — Vertragspartner handelt als
//      Verbraucher (§ 13 BGB), daher Widerrufsrecht mit vorzeitigem
//      Erlöschen bei vollständiger Leistungserbringung nach § 356 Abs. 4 BGB.
//   3) Einmalige Gebühr für Selbstverwaltungszugriff auf ein bereits
//      bestehendes Talent-Profil (Vereinswechsel-Angabe, Video-Upload) —
//      rechtlich wie 2) behandelt.
export default function TermsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-3 bg-paper px-4 py-12">
      <div className="w-full max-w-3xl rounded-xl border border-line bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <LogoLockup height={90} className="mb-2" />
          <h1 className="font-display text-xl font-medium text-ink">
            Allgemeine Geschäftsbedingungen &amp; Widerrufsbelehrung
          </h1>
        </div>

        <div className="mb-6 rounded-lg border border-brick/30 bg-brick/5 px-4 py-3 text-sm text-brick">
          <p className="font-medium">
            ENTWURF — noch nicht anwaltlich geprüft.
          </p>
          <p className="mt-1">
            Dieser Text wurde inhaltlich sorgfältig auf Basis des
            tatsächlichen Produkts (Preise, Zahlungsarten, Vertragstypen)
            erstellt, ersetzt aber keine anwaltliche Prüfung. Er darf nicht
            als endgültige, rechtsverbindliche Vertragsgrundlage verwendet
            werden, bevor er von einer Rechtsanwältin/einem Rechtsanwalt
            geprüft und freigegeben wurde. Die Betreiberangaben sind
            ausgefüllt; verbleibende „[PLATZHALTER]“ betreffen offene
            Geschäfts-/Steuerfragen und Klauseln, die noch anwaltlich
            festzulegen sind. Vor dem eigentlichen Livegang zusätzlich in
            die übrigen vier Portalsprachen (en/es/pt/fr) übersetzen —
            bisher bewusst nur Deutsch, siehe Datei-Kommentar oben.
          </p>
          <p className="mt-1 text-xs text-brick/80">
            DRAFT — not yet reviewed by a lawyer. Content is grounded in the
            actual product (pricing, payment types, contract types), but
            this must still be reviewed and approved by a lawyer before it
            may be used as the final, binding contract basis. Fields marked
            „[PLATZHALTER]“ are still missing and must be filled in first.
            Before the actual public launch, also translate into the other
            four portal languages (en/es/pt/fr) — deliberately German-only
            for now, see the file comment above.
          </p>
        </div>

        <div className="flex flex-col gap-6 text-sm text-ink">
          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 1 Geltungsbereich, Vertragspartner
            </h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle
              kostenpflichtigen Leistungen von Talent Catcher: (a) die
              Nutzung der Scouting- und Verwaltungssoftware durch Vereine und
              Landesverbände im Rahmen eines Abonnements sowie (b) die
              einmalige, kostenpflichtige Registrierung eines Spielers als
              Talent-Kandidat bzw. den einmaligen Selbstverwaltungszugriff
              auf ein bestehendes Talent-Profil durch Erziehungsberechtigte
              oder volljährige Spieler.
            </p>
            <p className="mt-2">
              Anbieter und Vertragspartner ist:
              <br />
              Markus Burkhardt
              <br />
              Gartenstraße 9, 72280 Dornstetten
              <br />
              E-Mail: burkhardt.markus93@gmail.com
              <br />
              Einzelunternehmer, kein Handelsregistereintrag. Talent
              Catcher wird im Rahmen derselben freiberuflichen Tätigkeit
              betrieben wie das übrige Trainer-/Coaching-Angebot des
              Betreibers; es wird von der Kleinunternehmerregelung gemäß
              § 19 UStG Gebrauch gemacht, es wird daher keine Umsatzsteuer
              ausgewiesen. [PLATZHALTER: Diese Einordnung setzt voraus, dass
              der Gesamtumsatz aus allen freiberuflichen Tätigkeiten des
              Betreibers zusammen im Vorjahr 25.000 € und im laufenden Jahr
              voraussichtlich 100.000 € nicht übersteigt (§ 19 Abs. 1 UStG,
              Stand 2025/2026) — bei Wachstum der Umsätze regelmäßig mit
              dem Finanzamt/Steuerberater neu prüfen.]
              <br />
              (im Folgenden „wir“ oder „Talent Catcher“)
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 2 Leistungsbeschreibung
            </h2>
            <p className="mb-2">
              <span className="font-medium">
                a) Vereins-/Verband-Abonnement:
              </span>{" "}
              Talent Catcher stellt Vereinen und Landesverbänden eine
              webbasierte Software zur Beobachtung, Dokumentation und
              automatisierten Frühwarnung im Rahmen der Talentförderung zur
              Verfügung. Nach einer kostenlosen, dreitägigen Testphase ist
              die weitere Nutzung kostenpflichtig gemäß dem gewählten Plan
              (§ 3).
            </p>
            <p className="mb-2">
              <span className="font-medium">
                b) Registrierung eines Talent-Kandidaten:
              </span>{" "}
              Gegen die einmalige Gebühr nach § 3 wird eine Bewerbung als
              Talent bei einem vom Nutzer gewählten Verein erfasst und
              diesem zur Prüfung vorgelegt. Die Zahlung ist eine
              Bearbeitungsgebühr für Erfassung und Weiterleitung der
              Bewerbung — sie ist keine Garantie oder Zusicherung, dass der
              Verein die Bewerbung annimmt oder die Person als Talent
              aufnimmt. Bei minderjährigen Spielern wird die Registrierung
              ausschließlich von einem/einer Erziehungsberechtigten
              vorgenommen und bezahlt.
            </p>
            <p>
              <span className="font-medium">
                c) Selbstverwaltungszugriff auf ein bestehendes Talent-Profil:
              </span>{" "}
              Ist eine Person beim gewählten Verein bereits als Talent
              gelistet, kann sie (bzw. bei Minderjährigen deren
              Erziehungsberechtigte/r) gegen die einmalige Gebühr nach § 3
              einen zeitlich unbefristeten Zugang erhalten, um Vereins-
              und Team-Angaben zu aktualisieren und Videomaterial
              hochzuladen — jeweils nur nach vorheriger Anforderung durch
              den betreuenden Verein.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 3 Preise und Zahlung
            </h2>
            <p className="mb-2">
              Alle Preise verstehen sich als Endpreise in Euro. Der Anbieter
              macht von der Kleinunternehmerregelung gemäß § 19 UStG
              Gebrauch; die ausgewiesenen Preise enthalten daher keine
              Umsatzsteuer.
            </p>
            <p className="mb-2">
              Die Vereins-/Verband-Abonnements werden monatlich oder
              jährlich im Voraus abgerechnet, abhängig vom bei Vertragsschluss
              gewählten Abrechnungszeitraum und Plan. Die jeweils aktuellen
              Preise sind auf der Preisseite der Anwendung einsehbar.
            </p>
            <p>
              Die einmaligen Gebühren nach § 2 b) und c) werden vor der
              Zahlung im jeweiligen Formular angezeigt und sind mit
              Zahlungsbestätigung fällig; es handelt sich um eine einmalige
              Zahlung, kein Abonnement. Die Zahlungsabwicklung für alle
              Zahlungsarten erfolgt über den Zahlungsdienstleister Stripe.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 4 Vertragsschluss
            </h2>
            <p>
              Bei Abonnements kommt der Vertrag durch Auswahl eines Plans und
              erfolgreichen Abschluss des Zahlungsvorgangs zustande. Bei den
              einmaligen Gebühren nach § 2 b) und c) kommt der Vertrag durch
              Absenden des jeweiligen Formulars und erfolgreichen Abschluss
              des Zahlungsvorgangs zustande.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 5 Nutzungsrechte an hochgeladenen Inhalten
            </h2>
            <p>
              Soweit Nutzer (Vereine, Erziehungsberechtigte oder volljährige
              Spieler) im Rahmen der Nutzung Inhalte hochladen (insbesondere
              Videomaterial), räumen sie Talent Catcher das für den
              Vertragszweck erforderliche, nicht-exklusive Nutzungsrecht ein,
              diese Inhalte innerhalb der Anwendung zu speichern, dem
              jeweils berechtigten Verein anzuzeigen und im Rahmen der
              technischen Bereitstellung zu verarbeiten. Eine
              Weitergabe an Dritte außerhalb der Anwendung findet nicht
              statt, soweit in der Datenschutzerklärung nichts anderes
              geregelt ist. Nutzer versichern, zum Hochladen der jeweiligen
              Inhalte berechtigt zu sein und alle erforderlichen
              Einwilligungen (insbesondere bei Abbildungen Minderjähriger)
              eingeholt zu haben.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 6 Pflichten der Nutzer
            </h2>
            <p>
              Nutzer verpflichten sich, bei der Registrierung und
              Nutzung wahrheitsgemäße Angaben zu machen, Zugangsdaten
              vertraulich zu behandeln und die Anwendung nicht für
              rechtswidrige Zwecke einzusetzen. Vereine und Landesverbände
              sind für die Rechtmäßigkeit der von ihnen erfassten
              personenbezogenen Daten Minderjähriger (insbesondere das
              Vorliegen einer wirksamen Einwilligung der
              Erziehungsberechtigten für Bewertungen und Videomaterial)
              selbst verantwortlich.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 7 Vertragslaufzeit und Kündigung von Abonnements
            </h2>
            <p className="mb-2">
              Vereins-/Verband-Abonnements werden von Vereinen und
              Landesverbänden im Rahmen ihrer organisatorischen Tätigkeit
              und damit als Unternehmer im Sinne des § 14 BGB abgeschlossen.
              Monatliche Abonnements sind zum Ende des jeweils laufenden
              Abrechnungsmonats kündbar, jährliche Abonnements zum Ende der
              jeweiligen Vertragslaufzeit mit einer Frist von sechs Wochen.
              Erfolgt keine Kündigung, verlängert sich das Abonnement
              automatisch um den gewählten Abrechnungszeitraum.
            </p>
            <p>
              Die Kündigung sowie die Verwaltung der Zahlungsmethode können
              selbstständig über das Kundenportal (erreichbar über den
              Bereich „Abrechnung” in der Anwendung) vorgenommen werden.
              Das Recht zur außerordentlichen Kündigung aus wichtigem Grund
              bleibt unberührt.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 8 Beginn der Leistung vor Ablauf der Widerrufsfrist
              (einmalige Gebühren)
            </h2>
            <p>
              Für die einmaligen Gebühren nach § 2 b) und c) gilt: Mit
              Bestätigung der Zahlung erklärt sich die zahlende Person
              ausdrücklich damit einverstanden, dass Talent Catcher bereits
              vor Ablauf der Widerrufsfrist mit der Erbringung der Leistung
              (Erfassung und Weiterleitung der Bewerbung bzw. Freischaltung
              des Selbstverwaltungszugriffs) beginnt, und bestätigt zugleich
              die Kenntnis vom vorzeitigen Erlöschen des Widerrufsrechts bei
              vollständiger Erbringung (siehe Widerrufsbelehrung unten).
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 9 Haftung
            </h2>

            <p className="mb-2">
              <span className="font-medium">(1) Unbeschränkte Haftung.</span>{" "}
              Der Anbieter haftet unbeschränkt für Schäden, die durch
              vorsätzliches oder grob fahrlässiges Verhalten des Anbieters,
              seiner gesetzlichen Vertreter, Mitarbeitenden oder
              Erfüllungsgehilfen verursacht wurden. Der Anbieter haftet
              außerdem unbeschränkt für Schäden aus der Verletzung des
              Lebens, des Körpers oder der Gesundheit, die auf einer
              vorsätzlichen oder fahrlässigen Pflichtverletzung des
              Anbieters, seiner gesetzlichen Vertreter, Mitarbeitenden oder
              Erfüllungsgehilfen beruhen.
            </p>

            <p className="mb-2">
              <span className="font-medium">
                (2) Haftung bei leicht fahrlässiger Verletzung wesentlicher
                Vertragspflichten.
              </span>{" "}
              Bei leicht fahrlässiger Verletzung wesentlicher
              Vertragspflichten haftet der Anbieter nur auf Ersatz des
              vertragstypischen, bei Vertragsschluss vorhersehbaren
              Schadens. Wesentliche Vertragspflichten sind Pflichten, deren
              Erfüllung die ordnungsgemäße Durchführung des Vertrags
              überhaupt erst ermöglicht und auf deren Einhaltung der Nutzer
              regelmäßig vertrauen darf. Hierzu zählt insbesondere die
              Bereitstellung des vertraglich vereinbarten Zugangs zu den
              jeweils gebuchten Funktionen der Plattform.
            </p>

            <p className="mb-2">
              <span className="font-medium">
                (3) Ausschluss der weitergehenden Haftung bei leichter
                Fahrlässigkeit.
              </span>{" "}
              Im Übrigen ist eine Haftung des Anbieters für leicht
              fahrlässig verursachte Schäden ausgeschlossen.
            </p>

            <p className="mb-1">
              <span className="font-medium">
                (4) Kein Anspruch auf sportlichen, wirtschaftlichen oder
                vermittelnden Erfolg.
              </span>{" "}
              Talent Catcher stellt eine digitale Plattform zur Verwaltung,
              Übermittlung und Einsichtnahme von Talentprofilen, Videos,
              Leistungsinformationen und Scoutberichten bereit. Der
              Anbieter schuldet keinen bestimmten sportlichen, persönlichen
              oder wirtschaftlichen Erfolg. Insbesondere besteht kein
              Anspruch auf:
            </p>
            <ul className="mb-2 ml-5 list-disc">
              <li>
                eine Sichtung, Bewertung oder Kontaktaufnahme durch einen
                Scout;
              </li>
              <li>
                die Einladung zu einem Probetraining, Auswahlverfahren oder
                sonstigen Termin;
              </li>
              <li>
                die Aufnahme in ein Team, einen Verein, ein
                Nachwuchsleistungszentrum oder eine sonstige Organisation;
              </li>
              <li>
                den Abschluss eines Spielervertrags, Ausbildungs-, Förder-
                oder Sponsoringvertrags;
              </li>
              <li>
                eine Vermittlung, Förderung, Nominierung, Empfehlung oder
                sonstige Karrierechance.
              </li>
            </ul>
            <p className="mb-2">
              Talent Catcher ist — sofern nicht im Einzelfall ausdrücklich
              und in Textform etwas anderes vereinbart wurde — weder
              Sportagentur noch Arbeitsvermittler und übernimmt keine
              Verpflichtung zur Vermittlung von Talenten an Vereine,
              Scouts, Agenturen oder sonstige Dritte.
            </p>

            <p className="mb-2">
              <span className="font-medium">
                (5) Inhalte von Nutzern und Scouts.
              </span>{" "}
              Für die Richtigkeit, Vollständigkeit, Aktualität, Qualität,
              rechtliche Zulässigkeit oder sportliche Aussagekraft von
              durch Eltern, Sorgeberechtigte, Scouts oder sonstige
              berechtigte Nutzer eingestellten Profilangaben, Videos,
              Leistungsdaten, Nachrichten, Bewertungen, Einschätzungen,
              Empfehlungen oder Scoutberichten übernimmt der Anbieter keine
              Gewähr. Scoutberichte und Einschätzungen stellen
              ausschließlich die persönliche fachliche Bewertung des
              jeweils zuständigen Scouts zum Zeitpunkt ihrer Erstellung
              dar. Sie sind weder eine Garantie für die sportliche
              Entwicklung eines Talents noch eine verbindliche Prognose,
              Zusage oder Vermittlungsempfehlung. Gesetzliche Prüf-,
              Sperr-, Lösch- und Entfernungspflichten des Anbieters,
              insbesondere nach Kenntniserlangung von rechtswidrigen
              Inhalten, bleiben unberührt.
            </p>

            <p className="mb-2">
              <span className="font-medium">
                (6) Eingeschränkter Zugriff auf vertrauliche Inhalte.
              </span>{" "}
              Videos, Scoutberichte und sonstige als vertraulich
              gekennzeichnete Inhalte sind nicht öffentlich abrufbar. Sie
              werden ausschließlich denjenigen Scouts und sonstigen
              berechtigten Nutzern zugänglich gemacht, denen der jeweilige
              Zugriff im Rahmen der Plattform ausdrücklich zugeordnet oder
              erteilt wurde. Der Anbieter trifft angemessene technische und
              organisatorische Maßnahmen, um unbefugte Zugriffe zu
              verhindern. Eine absolute Sicherheit der Datenübertragung,
              Datenspeicherung oder Zugriffskontrolle kann jedoch nicht
              gewährleistet werden. Soweit gesetzlich zulässig, haftet der
              Anbieter nicht für Schäden, die durch einen unbefugten
              Zugriff Dritter entstehen, sofern dieser nicht auf einer
              vorsätzlichen oder grob fahrlässigen Pflichtverletzung des
              Anbieters beruht; Absatz 2 bleibt unberührt.
            </p>

            <p className="mb-2">
              <span className="font-medium">
                (7) Verantwortung der Eltern und Sorgeberechtigten.
              </span>{" "}
              Bei Profilen minderjähriger Talente handelt ausschließlich
              der anmeldende Elternteil bzw. die anmeldende
              sorgeberechtigte Person als Vertragspartner und
              Verantwortlicher für die Registrierung sowie die
              eingestellten Inhalte. Der anmeldende Elternteil bzw. die
              anmeldende sorgeberechtigte Person sichert zu, zur Anmeldung
              und zur Übermittlung der Daten, Bildnisse, Videos und
              sonstigen Inhalte des minderjährigen Talents berechtigt zu
              sein. Dies gilt insbesondere für die erforderliche
              Einwilligung aller Sorgeberechtigten, soweit diese nach den
              Umständen erforderlich ist. Der Anbieter haftet nicht für
              Nachteile oder Ansprüche, die daraus entstehen, dass eine für
              die Anmeldung, Verarbeitung oder Bereitstellung von Daten und
              Inhalten erforderliche Einwilligung oder Berechtigung nicht,
              nicht wirksam oder nicht ausreichend vorlag, es sei denn, der
              Anbieter hat den Umstand vorsätzlich oder grob fahrlässig
              verursacht.
            </p>

            <p className="mb-2">
              <span className="font-medium">
                (8) Verfügbarkeit der Plattform und Dienste Dritter.
              </span>{" "}
              Der Anbieter bemüht sich um eine möglichst
              unterbrechungsfreie Verfügbarkeit von Talent Catcher. Eine
              jederzeitige, fehlerfreie und unterbrechungsfreie
              Verfügbarkeit der Plattform wird jedoch nicht geschuldet,
              soweit dies nicht ausdrücklich individuell vereinbart wurde.
              Der Anbieter haftet nicht für Beeinträchtigungen, Ausfälle,
              Verzögerungen, Datenübertragungsfehler oder Datenverluste,
              die auf Umständen beruhen, die der Anbieter nicht zu
              vertreten hat. Dies betrifft insbesondere Störungen oder
              Ausfälle von Telekommunikationsnetzen, Internetverbindungen,
              Hosting-, Cloud-, Video-, E-Mail-, Zahlungs- oder sonstigen
              Drittanbieterdiensten, Endgeräten oder Software der Nutzer,
              Cyberangriffe, unbefugte Zugriffe Dritter, höhere Gewalt
              sowie sonstige Ereignisse außerhalb des Einflussbereichs des
              Anbieters. Die Haftung nach den Absätzen 1 und 2 bleibt
              hiervon unberührt.
            </p>

            <p className="mb-2">
              <span className="font-medium">
                (9) Gesetzlich zwingende Ansprüche.
              </span>{" "}
              Die Haftung nach dem Produkthaftungsgesetz, für ausdrücklich
              übernommene Garantien sowie aufgrund sonstiger zwingender
              gesetzlicher Vorschriften bleibt unberührt.
            </p>

            <p>
              <span className="font-medium">
                (10) Einbeziehung von Mitarbeitenden und
                Erfüllungsgehilfen.
              </span>{" "}
              Soweit die Haftung des Anbieters nach diesen Bestimmungen
              ausgeschlossen oder beschränkt ist, gilt dies auch zugunsten
              seiner gesetzlichen Vertreter, Mitarbeitenden, freien
              Mitarbeitenden, Scouts, Erfüllungsgehilfen und sonstigen
              Personen, deren sich der Anbieter zur Erfüllung seiner
              vertraglichen Pflichten bedient.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 10 Datenschutz
            </h2>
            <p>
              Informationen zur Verarbeitung personenbezogener Daten,
              insbesondere von Minderjährigen, enthält die{" "}
              <Link href="/datenschutz" className="underline-offset-2 hover:underline">
                Datenschutzerklärung
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 11 Änderungen dieser AGB
            </h2>
            <p>
              Änderungen dieser AGB werden bestehenden Vereins-/
              Verband-Kunden mit angemessener Frist vor Inkrafttreten in
              Textform (z. B. per E-Mail) mitgeteilt. Widerspricht der
              Kunde nicht innerhalb von sechs Wochen ab Zugang der
              Mitteilung, gelten die geänderten Bedingungen als
              angenommen; auf diese Rechtsfolge wird in der Mitteilung
              gesondert hingewiesen. Für die einmaligen Gebühren nach § 2
              b) und c)
              gelten stets die zum Zeitpunkt der jeweiligen Zahlung
              angezeigten Bedingungen.
            </p>
          </section>

          <section>
            <h2 className="mb-1.5 font-display text-base font-medium text-ink">
              § 12 Schlussbestimmungen
            </h2>
            <p>
              Es gilt das Recht der Bundesrepublik Deutschland unter
              Ausschluss des UN-Kaufrechts. Ist der Kunde Kaufmann,
              juristische Person des öffentlichen Rechts oder öffentlich-
              rechtliches Sondervermögen, ist der Sitz des Anbieters
              (Dornstetten) ausschließlicher Gerichtsstand für alle
              Streitigkeiten aus diesem Vertrag. Sollten einzelne
              Bestimmungen dieser AGB
              unwirksam sein, bleibt die Wirksamkeit der übrigen
              Bestimmungen unberührt.
            </p>
          </section>

          <section className="border-t border-line pt-6">
            <h2 className="mb-1.5 font-display text-lg font-medium text-ink">
              Widerrufsbelehrung
            </h2>
            <p className="mb-3 text-xs text-muted">
              Diese Widerrufsbelehrung gilt ausschließlich für die einmaligen
              Gebühren nach § 2 b) und c), soweit die zahlende Person als
              Verbraucherin/Verbraucher (§ 13 BGB) handelt. Für
              Vereins-/Verband-Abonnements besteht kein
              verbraucherrechtliches Widerrufsrecht, da diese von Vereinen
              und Landesverbänden als Unternehmer (§ 14 BGB) im Rahmen ihrer
              organisatorischen Tätigkeit abgeschlossen werden
              (§ 312g Abs. 1 BGB).
            </p>

            <p className="mb-2 font-medium">Widerrufsrecht</p>
            <p>
              Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von
              Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist
              beträgt vierzehn Tage ab dem Tag des Vertragsschlusses.
            </p>
            <p className="mt-2">
              Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Markus
              Burkhardt, Kontaktdaten siehe{" "}
              <Link href="/help" className="underline-offset-2 hover:underline">
                Hilfe &amp; Kontakt
              </Link>
              ) mittels einer eindeutigen Erklärung (z. B. mit der Post
              versandter Brief oder E-Mail) über Ihren Entschluss, diesen
              Vertrag zu widerrufen, informieren. Sie können dafür das
              beigefügte Muster-Widerrufsformular verwenden, was jedoch
              nicht vorgeschrieben ist.
            </p>
            <p className="mt-2">
              Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die
              Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf
              der Widerrufsfrist absenden.
            </p>

            <p className="mt-3 font-medium">Erlöschen des Widerrufsrechts</p>
            <p>
              Ihr Widerrufsrecht erlischt vorzeitig, wenn wir die von Ihnen
              beauftragte Leistung vollständig erbracht haben — also sobald
              die Bewerbung dem gewählten Verein zur Prüfung vorgelegt wurde
              bzw. der Selbstverwaltungszugriff freigeschaltet wurde —, und
              Sie vor Beginn der Ausführung ausdrücklich zugestimmt haben,
              dass wir mit der Ausführung der Dienstleistung vor Ablauf der
              Widerrufsfrist beginnen, und Sie Ihre Kenntnis davon
              bestätigt haben, dass Sie durch Ihre Zustimmung mit Beginn der
              Ausführung des Vertrags Ihr Widerrufsrecht verlieren
              (§ 356 Abs. 4 BGB).
            </p>

            <p className="mt-3 font-medium">Folgen des Widerrufs</p>
            <p>
              Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle
              Zahlungen, die wir von Ihnen erhalten haben, unverzüglich und
              spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an
              dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns
              eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe
              Zahlungsmittel, das Sie bei der ursprünglichen Transaktion
              eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich
              etwas anderes vereinbart. Haben Sie verlangt, dass die
              Dienstleistung während der Widerrufsfrist beginnen soll, so
              haben Sie uns einen angemessenen Betrag zu zahlen, der dem
              Anteil der bis zu dem Zeitpunkt, zu dem Sie uns von der
              Ausübung des Widerrufsrechts hinsichtlich dieses Vertrags
              unterrichten, bereits erbrachten Leistung im Vergleich zum
              Gesamtumfang der im Vertrag vorgesehenen Leistungen
              entspricht.
            </p>

            <div className="mt-4 rounded-lg bg-paper px-4 py-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                Muster-Widerrufsformular
              </p>
              <p className="text-xs text-muted">
                (Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte
                dieses Formular aus und senden Sie es zurück.)
              </p>
              <p className="mt-2 text-xs text-ink">
                An: Markus Burkhardt, Gartenstraße 9, 72280 Dornstetten,
                burkhardt.markus93@gmail.com
                <br />
                <br />
                Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*)
                abgeschlossenen Vertrag über die Erbringung der folgenden
                Dienstleistung (*):
                <br />
                <br />
                Bestellt am (*): __________
                <br />
                Name des/der Verbraucher(s):
                <br />
                Anschrift des/der Verbraucher(s):
                <br />
                Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf
                Papier):
                <br />
                Datum:
                <br />
                <br />
                (*) Unzutreffendes streichen.
              </p>
            </div>
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
