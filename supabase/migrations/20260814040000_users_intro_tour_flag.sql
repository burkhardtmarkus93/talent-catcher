-- "Erste Schritte"-Produkttour: einmaliges Onboarding, das der Nutzer
-- manuell wegklicken oder überspringen kann; danach startet sie beim
-- nächsten Login nicht mehr automatisch (kann aber jederzeit über die
-- Sidebar erneut gestartet werden).
--
-- RLS-Überlegung: has_seen_intro_tour liegt auf public.users, bereits
-- durch die bestehende Policy "users_update_own" (id = auth.uid(), aus
-- 20260723020500_disable_recursive_users_policies.sql) auf die eigene
-- Zeile beschränkt. Anders als role/club_id/has_youth_access (siehe
-- guard_users_self_update() aus
-- 20260814010000_signup_plans_and_self_update_guard.sql) wird dieses
-- Feld bewusst NICHT zusätzlich gesperrt — "Tour als gesehen markieren"
-- ist reine, unkritische Selbstverwaltung ohne Berechtigungs- oder
-- Datenschutzbezug, anders als die dort gesperrten Felder.

alter table public.users
  add column if not exists has_seen_intro_tour boolean not null default false;
