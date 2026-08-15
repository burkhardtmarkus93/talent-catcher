-- Anzeigename fürs eigene Profil (app/profile).
--
-- RLS-Überlegung: full_name liegt auf public.users, Selbst-Update bereits
-- durch users_update_own (id = auth.uid()) abgedeckt. Anders als
-- role/club_id/has_youth_access (guard_users_self_update()) ist dieses
-- Feld bewusst NICHT zusätzlich gesperrt — den eigenen Anzeigenamen zu
-- setzen ist reine, unkritische Selbstverwaltung ohne Berechtigungs- oder
-- Datenschutzbezug (gleiches Muster wie has_seen_intro_tour aus
-- 20260814040000_users_intro_tour_flag.sql).

alter table public.users
  add column if not exists full_name text;
