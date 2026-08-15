-- Vier Ja/Nein-Kennzeichen pro Talent, die ein Scout in der Übersicht
-- setzen und in der Talentliste danach filtern kann: DFB-Stützpunkt,
-- Verbandsauswahl, Nationalmannschaft, NLZ.
--
-- RLS-Überlegung: Alle vier Spalten liegen auf public.talents, bereits
-- durch talents_select_same_club / talents_update_same_club (live gegen
-- die DB per pg_policies geprüft) auf den eigenen Verein beschränkt.
-- Keine neue Policy nötig — anders als is_minor (aus der birth_date
-- abgeleitet, siehe trg_talents_derived) sind das reine, unkritische
-- Beobachtungsdaten ohne Bezug zu Jugendschutz-Berechtigungen.

alter table public.talents
  add column if not exists dfb_stuetzpunkt boolean not null default false,
  add column if not exists verbandsauswahl boolean not null default false,
  add column if not exists nationalmannschaft boolean not null default false,
  add column if not exists nlz boolean not null default false;
