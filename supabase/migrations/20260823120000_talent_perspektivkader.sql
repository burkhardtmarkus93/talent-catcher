-- Sechstes Auswahl-/Förderungs-Kennzeichen (siehe 20260815050000_
-- talent_selection_flags.sql für DFB-Stützpunkt/Verbandsauswahl/
-- Nationalmannschaft/NLZ, 20260820110000_talent_eu_passport.sql für
-- EU-Pass): Perspektivkader.
--
-- WICHTIG (siehe CLAUDE.md Kapitel 8 — bei fachlichen Verbandsfragen im
-- Zweifel auf Aktualisierungsbedarf hinweisen statt zu raten):
-- "Perspektivkader" ist KEIN bundeseinheitlich definierter Begriff —
-- jeder Landesverband legt eigene Kriterien und oft eigene
-- Sichtungskader-Stufen (z. B. Perspektivkader/Sichtungskader/
-- Stützpunktkader) mit unterschiedlichen Altersstufen fest. Dieses Feld
-- bildet deshalb bewusst nur ein einfaches Ja/Nein-Beobachtungsmerkmal
-- ab ("der Verein stuft dieses Talent als Perspektivkader-Kandidat
-- seines Landesverbands ein"), keine geprüfte, offizielle Kader-
-- Zugehörigkeit. Der Hinweistext in der UI (siehe talentDetailPage.
-- perspektivkaderHint in messages/*.json) macht das für Nutzer/innen
-- explizit.
--
-- Gleiche RLS-Einstufung wie die bestehenden fünf Flags: reine,
-- unkritische Beobachtungsdaten ohne Bezug zu Jugendschutz-
-- Berechtigungen, bereits durch talents_select_same_club/
-- talents_update_same_club abgedeckt, keine neue Policy nötig.

alter table public.talents
  add column if not exists perspektivkader boolean not null default false;

-- landesverband_talents_view (20260819100000_landesverband_role.sql,
-- zuletzt erweitert in 20260820110000_talent_eu_passport.sql) um
-- dasselbe Kennzeichen erweitert, aus Konsistenz mit den fünf bereits
-- dort enthaltenen Auswahl-/Förderungs-Flags — für einen Landesverband
-- ist gerade die eigene Perspektivkader-Einschätzung der Vereine von
-- Interesse. Bewusst als letzte Spalte (siehe Begründung in
-- 20260820110000_talent_eu_passport.sql zu "create or replace view").
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
  t.eu_passport,
  t.perspektivkader
from public.talents t
join public.clubs c on c.id = t.club_id
where c.landesverband_id = public.current_user_landesverband_id()
  and t.visibility_status = 'freigegeben'
  and (not t.is_minor or public.current_user_has_youth_access());
