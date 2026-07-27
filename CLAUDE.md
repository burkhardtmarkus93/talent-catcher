# CLAUDE.md — Projektregeln für Talent Catcher

Diese Datei gibt Claude (über Claude Code / die GitHub-App) verbindliche Regeln für die Arbeit in diesem Repository. Sie wird bei jeder Session automatisch mitgelesen.

## 1. Projektüberblick

Talent Catcher ist ein Scouting- und Frühwarnsystem für Talentförderung im Amateur- und Nachwuchsfußball. Kernidee: automatisierte Risiko-/Chancen-Erkennung auf Basis gesammelter Bewertungsdaten (nicht nur Berichtsverwaltung).

**Aktuelle Ausbaustufe:** Stufe 1 (MVP) — Scouting-Frühwarnsystem für Vereine/Scouts. Rollen für Trainer, Eltern, Landesverbände und NLZ sind geplante Erweiterungen, aber noch nicht implementiert.

**Zielgruppen (Reihenfolge der Priorität):** 1. Amateurvereine/Scouts, 2. Landesverbände, 3. Profi-NLZ als Zubringer-Kunde, 4. Trainer (Trainerbörse), 5. Eltern.

## 2. Tech-Stack (bitte einhalten, nicht wechseln)

- **Next.js 14** mit App Router — kein Pages Router verwenden
- **React 18**, **TypeScript** — kein plain JavaScript für neue Dateien
- **Supabase** für Datenbank, Auth und Row-Level-Security (`@supabase/ssr`, `@supabase/supabase-js`)
- **Tailwind CSS** fürs Styling
- Migrationen liegen unter `supabase/migrations/` (`schema.sql`, `policies.sql`, `seed.sql`) — neue Schemaänderungen immer als zusätzliche Migration, bestehende Migrationsdateien nicht nachträglich verändern
- `middleware.ts` regelt Auth-/Session-Handling — bestehende Middleware-Logik nicht ohne Rücksprache umbauen

## 3. Grundprinzip: Rollen- und Datenschutz zuerst

Dieses Produkt verarbeitet perspektivisch Daten von **Minderjährigen**. Für jede Änderung gilt:

- Neue Tabellen/Spalten mit Personenbezug **immer** mit Row-Level-Security (RLS) versehen, nie offen lassen "für später"
- Die bestehende Jugendschutz-Sperre (`has_youth_access` bzw. äquivalente Flags) darf nicht umgangen, deaktiviert oder in ihrer Wirkung abgeschwächt werden, auch nicht temporär für Tests
- Neue Rollen (Trainer, Eltern, Verband, NLZ) erhalten grundsätzlich nur Zugriff auf das, was für ihre Funktion nötig ist (Prinzip der Datensparsamkeit) — nicht per Default alles sichtbar machen und später einschränken
- Bei Unsicherheit, ob eine Datenkategorie sensibel ist (Fotos/Videos, Kontaktdaten, Leistungsbewertungen Minderjähriger): im Zweifel als sensibel behandeln

## 4. Phasenmodell — was gebaut werden darf und was nicht

**Phase 1 (aktueller Stand, weiter ausbaufähig):** Beobachtung, Dokumentation, automatisierte Frühwarnung (Risk-Engine), Wiedervorlagen, Rollenmodell für Vereine/Verbände/Trainer/Eltern als Betrachter/Erfasser ihrer eigenen Daten.

**Phase 2 (NICHT ohne ausdrückliche Freigabe umsetzen):** Aktive Vermittlungs- oder Matching-Funktionen zwischen Personen (Trainerbörse mit direkter Kontaktvermittlung, "Tinder"-artiges Spieler-Matching, automatisierte Vereinswechsel-Abwicklung). Diese Funktionen berühren die DFB-Jugendordnung (Wechselfristen, Ausbildungsentschädigung bei Wechsel zu Leistungszentrums-Vereinen) und ggf. FIFA-Regularien. **Claude soll hierzu Vorschläge/Entwürfe machen dürfen, aber keine Funktion live schalten oder als "fertig" markieren, ohne dass der Projektverantwortliche das explizit bestätigt.**

Wenn eine Aufgabe implizit in Richtung Phase 2 geht (z. B. "baue eine Kontaktfunktion zwischen Spieler und Trainer"), soll Claude das **explizit benennen** und nachfragen, statt es einfach umzusetzen.

## 5. Code- und Architekturkonventionen

- Bestehende Ordnerstruktur beibehalten, keine parallelen/konkurrierenden Verzeichnisstrukturen einführen
- Neue Server-Logik nach Möglichkeit als Server Components / Route Handlers im App-Router-Stil, konsistent mit bestehendem Code
- Keine neuen State-Management-Bibliotheken oder UI-Frameworks einführen, ohne das vorher zur Diskussion zu stellen
- Bestehende Namenskonventionen (z. B. `riskEngine.ts`) fortführen, keine Umbenennung bestehender zentraler Dateien ohne triftigen Grund
- Dummy-/Platzhalterdaten (Dashboard, Watchlists, Import, Admin) klar als solche kennzeichnen, solange sie nicht an echte Datenquellen angebunden sind

## 6. Umgang mit Migrationen und Secrets

- Niemals Zugangsdaten, API-Keys oder `.env`-Inhalte in Commits, PRs oder Kommentaren ausgeben
- Migrationsdateien sind additiv – keine bestehende Migration überschreiben, stattdessen eine neue anlegen
- Vor jeder Schema-Änderung kurz beschreiben, welche RLS-Policy dafür nötig ist

## 7. Wie Pull Requests aussehen sollen

- Ein PR = eine klar abgegrenzte Aufgabe (keine Sammel-PRs mit mehreren unabhängigen Änderungen)
- PR-Beschreibung enthält: Was wurde geändert, warum, welche Migrationen/RLS-Änderungen enthalten sind, was noch offen/zu prüfen ist
- Bei Unsicherheit über Produktentscheidungen (z. B. genaue Geschäftslogik der Risk-Engine) lieber im PR oder Issue nachfragen, statt eine Annahme zu treffen und stillschweigend umzusetzen
- Claude committet nicht direkt in `main` — Änderungen laufen immer über einen Branch + Pull Request zur Freigabe

## 8. Was Claude bei Unklarheit tun soll

- Bei rechtlich sensiblen Themen (Jugendschutz, Vereinswechsel-Logik, Vermittlung) lieber zu vorsichtig als zu freizügig sein und auf Kapitel 5 des Businessplans (Rechtlicher Rahmen) verweisen
- Bei fachlichen Fußball-/Verbandsfragen (z. B. genaue Wechselfristen einer bestimmten Altersklasse) im Zweifel den Stand aus der DFB-Jugendordnung (Stand 15. Juli 2024, § 3/§ 3a) als Referenz nennen und auf Aktualisierungsbedarf hinweisen, statt zu raten
- Größere Architekturentscheidungen (neue Rolle einführen, Datenmodell grundlegend ändern) im Issue/PR zur Diskussion stellen, nicht direkt umsetzen
