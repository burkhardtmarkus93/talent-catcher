-- Fünftes Auswahl-/Förderungs-Kennzeichen (siehe 20260815050000_
-- talent_selection_flags.sql für DFB-Stützpunkt/Verbandsauswahl/
-- Nationalmannschaft/NLZ): EU-Pass, scoutingrelevant für Kader-/
-- Kontingentplanung (Nicht-EU-Ausländerregelungen). Gleiche
-- RLS-Einstufung wie die bestehenden vier Flags: reine, unkritische
-- Beobachtungsdaten ohne Bezug zu Jugendschutz-Berechtigungen, bereits
-- durch talents_select_same_club/talents_update_same_club abgedeckt,
-- keine neue Policy nötig.

alter table public.talents
  add column if not exists eu_passport boolean not null default false;

-- landesverband_talents_view (20260819100000_landesverband_role.sql)
-- um dasselbe Kennzeichen erweitert, aus Konsistenz mit den vier
-- bereits dort enthaltenen Auswahl-/Förderungs-Flags. eu_passport
-- bewusst als letzte Spalte (nach updated_at, nicht neben den anderen
-- Flags): "create or replace view" erlaubt nur das Anhängen neuer
-- Spalten ans Ende, keine Einfügung mitten in die bestehende
-- Spaltenliste (sonst Postgres-Fehler 42P16 beim Versuch, eine
-- bestehende Spalte umzubenennen).
create or replace view public.landesverband_talents_view as
select
  t.id,
  t.club_id,
  c.name as club_registered_name,
  t.club_name_text,
  t.team_name_text,
  t.first_name,
  t.last_name,
  t.birth_date,
  t.primary_position,
  t.secondary_position,
  t.is_minor,
  t.dfb_stuetzpunkt,
  t.verbandsauswahl,
  t.nationalmannschaft,
  t.nlz,
  t.updated_at,
  t.eu_passport
from public.talents t
join public.clubs c on c.id = t.club_id
where c.landesverband_id = public.current_user_landesverband_id()
  and t.visibility_status = 'freigegeben'
  and (not t.is_minor or public.current_user_has_youth_access());
