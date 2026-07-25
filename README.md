# Talent Catcher — geschlossener Kernflow (Prototyp)

Login → Talentliste → Talentdetail → Bericht speichern → Alert wird neu
berechnet → Reminder sichtbar/abschließbar → Talent anlegen mit
Jugendschutz. Watchlists, Import, Admin-Bereich und Uploads bleiben
bewusst unangetastet (Dummy-Daten bzw. nicht gebaut) — nicht Teil
dieser Runde.

## Lokal starten !

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Für einen vollständigen Durchlauf: `schema.sql`, `policies.sql`,
`seed.sql` im Supabase-Projekt ausgeführt, mindestens einen Auth-Nutzer
+ passende `public.users`-Zeile angelegt.

## Was in dieser Runde fertiggestellt wurde

1. **`lib/alerts/riskEngine.ts`** — minimale, aber echte Alert-
   Neuberechnung (`recalculateAlertForTalent`), aufgerufen direkt nach
   jedem gespeicherten Bericht in `lib/actions/reports.ts`. Deaktiviert
   den alten aktuellen Alert, speichert einen neuen mit `risk_level`,
   `risk_score`, `triggered_reasons`, `is_hidden_gem`.
2. **`app/(dashboard)/alerts-reminders/page.tsx`** — läuft jetzt auf
   `getTalents()` (Alerts-Tab) und `getOpenRemindersForClub()`
   (Wiedervorlagen-Tab), keine Dummy-Daten mehr.
3. **Reminder-Flow:** `lib/actions/reminders.ts` mit `createReminder`
   (kleines manuelles Setz-Formular, `components/reminders/ReminderForm.tsx`,
   jetzt auf der Talentdetailseite aktiv statt des alten deaktivierten
   Buttons) und `completeReminderManually` (Abschluss ohne Bericht,
   Button auf der Wiedervorlagen-Seite). Der automatische Abschluss
   über einen Bericht lief bereits seit letzter Runde.
4. **Talent anlegen fertiggestellt** (existierte vorher nur als toter
   Link!): `app/(dashboard)/talents/new/page.tsx`,
   `components/talents/NewTalentForm.tsx`, `lib/actions/talents.ts`.
   Echte DB-Speicherung, serverseitige `has_youth_access`-Blockierung
   mit sachlicher Fehlermeldung (zusätzlich zur RLS-Policy), Consent-
   Platzhalter bei Minderjährigen.

## Bewusste Vereinfachungen der Alert-Engine in diesem Prototyp

- Kein globaler Nachtjob — Neuberechnung nur direkt nach einem Bericht
  für genau dieses Talent.
- Keine Altersstufen-Differenzierung (U15/16 vs. U17-19) bei den
  Zeitschwellen, nur Torhüter- vs. Feldspieler-Unterscheidung.
- Hidden-Gem-Erkennung prüft nur "letzte Berichte konstant stark",
  nicht zusätzlich "Status seit > 180 Tagen unverändert" (dafür fehlt
  eine Statuswechsel-Historie).
- Alert-Update läuft als zwei sequenzielle Statements (deaktivieren,
  dann einfügen), nicht als atomare Postgres-Funktion/RPC — für einen
  Prototyp mit einem Nutzer unkritisch, für Produktivbetrieb mit
  parallelen Neuberechnungen sollte das nachgeschärft werden.

## Weiterhin unverändert (bewusst außerhalb des Scopes)

- Dashboard, Watchlists, Import: weiterhin `lib/dummy-data.ts`
- Kein Video-/Dokument-Upload
- Kein systemgenerierter Nachtjob für Reminder/Alerts (Cron)
