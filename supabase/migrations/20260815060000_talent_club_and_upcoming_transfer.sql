-- Ermöglicht zwei Dinge, die bisher fehlten:
-- 1. Der aktuelle Verein/Team eines Talents (club_name_text/
--    team_name_text, bisher nur bei der Anlage setzbar) kann jetzt auch
--    nachträglich aktualisiert werden, wenn ein Talent tatsächlich
--    gewechselt hat.
-- 2. Ein Scout kann einen aus seiner Beobachtung heraus bevorstehenden
--    Wechsel als reine Notiz vermerken (Zielverein + Freitext), damit er
--    weiß, dass sich eine Kontaktaufnahme aktuell nicht lohnt.
--
-- Bewusst NUR Beobachtung/Dokumentation (Phase 1 laut CLAUDE.md Kapitel
-- 4), keine Vermittlungs- oder Matching-Funktion: es wird nichts an
-- Dritte übermittelt, kein Kontakt hergestellt, keine Wechselfristen/
-- Ausbildungsentschädigung berechnet — reine Freitext-Notiz für den
-- scoutenden Verein selbst.
--
-- RLS-Überlegung: Alle vier Spalten liegen auf public.talents, bereits
-- durch talents_select_same_club / talents_update_same_club (live per
-- pg_policies geprüft) auf den eigenen Verein beschränkt. Keine neue
-- Policy nötig.

alter table public.talents
  add column if not exists upcoming_transfer_club_text text,
  add column if not exists upcoming_transfer_note text;
