## Zusammenfassung
<!-- Was wurde geändert und warum -->

## Bezug
Closes #<issue-nummer>

## Änderungstyp
- [ ] Feature
- [ ] Bugfix
- [ ] Supabase-Migration / RLS-Änderung
- [ ] Sonstiges (Doku, Refactor, ...)

## Checkliste vor Merge
- [ ] Code folgt bestehenden Konventionen (Next.js App Router, TypeScript, Tailwind)
- [ ] Keine Secrets/API-Keys im Code oder Commit-Verlauf
- [ ] Bei DB-Änderungen: neue, additive Migration (keine bestehende verändert)
- [ ] Migration nach Merge zusätzlich manuell im Supabase SQL-Editor ausgeführt (Repo-Migration ≠ echte DB-Änderung!)
- [ ] RLS-Policy für neue/geänderte Tabellen mit Personenbezug vorhanden und manuell getestet
- [ ] club_id-Mandantentrennung greift korrekt (mit zwei unterschiedlichen Test-Accounts geprüft)
- [ ] Kein Zugriff auf Jugendschutz-gesperrte Daten ohne Berechtigung möglich
- [ ] Kein LocalStorage/SessionStorage verwendet
- [ ] Vercel Preview aufgerufen und Kernfunktion manuell getestet
- [ ] Keine console.log/Debug-Reste
- [ ] PR ist auf eine abgegrenzte Aufgabe fokussiert (kein Sammel-PR)

## Testschritte (manuell auf der Vercel-Preview-URL)
1.
2.
3.

## Screenshots (bei UI-Änderungen)

## Offene Punkte / Notizen für den Review
