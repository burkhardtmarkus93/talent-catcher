-- Landesverband-Rolle (Phase 1, laut CLAUDE.md Kapitel 1/4: "Rollenmodell
-- für ... Landesverbände als Betrachter ... ihrer eigenen Daten"). Ein
-- Landesverband soll die freigegebenen Talentprofile der ihm zugeordneten
-- Vereine sehen können — für die Zielgruppen-Priorisierung "Profivereine/
-- NLZ, Landesverbände" (CLAUDE.md Kapitel 1) direkt relevant.
--
-- ACHTUNG (siehe CLAUDE.md Kapitel 8): Die unten geseedete Liste der
-- Landesverbände ist eine Annäherung aus Trainingswissen, KEINE
-- verifizierte Quelle. Vor Produktivbetrieb gegen die aktuelle
-- DFB-Satzung/-Website prüfen und ggf. korrigieren/vervollständigen —
-- Namen, Anzahl und Zuschnitt der Landesverbände können sich geändert
-- haben oder hier ungenau wiedergegeben sein.
--
-- Zugriffsmodell (mit dem Projektverantwortlichen abgestimmt):
--   1) Ein Verein trägt seinen Landesverband einmalig in der Verwaltung
--      ein (clubs.landesverband_id) -- keine Opt-in-Freigabe je Verein
--      nötig, das entspricht der realen Pflichtmitgliedschaft im
--      DFB-Verbandssystem.
--   2) Landesverband sieht NUR als "freigegeben" markierte Talente
--      (talents.visibility_status), und davon nur unkritische
--      Kern-Stammdaten -- keine Körpermaße, keine Scout-Berichte/
--      Bewertungen/Risikoeinschätzung, keine internen Notizen/Tags.
--      Gleiche Datensparsamkeit wie beim bereits bestehenden
--      talent_family_view für Eltern-Accounts.
--   3) Minderjährige sind nur für Landesverbands-Nutzer mit eigener
--      Jugendschutz-Berechtigung sichtbar (has_youth_access, analog zu
--      Vereins-Scouts) -- nicht automatisch für jeden Landesverband-Account.
--
-- Bewusst NICHT Teil dieser Migration: eine Selfservice-Einladungs-UI für
-- Landesverbands-Nutzer (der Verband/NLZ-Plan ist laut lib/plans.ts kein
-- Selfservice-Plan, "Dedizierter Ansprechpartner" -- Accounts werden also
-- vorerst manuell angelegt, z. B. per auth.admin.inviteUserByEmail mit
-- pending_role='landesverband' + pending_landesverband_id in den
-- User-Metadata, dasselbe Muster wie beim bestehenden Team-Invite).

-- 1) Lookup-Tabelle für Landesverbände.
create table if not exists public.landesverbaende (
  id uuid primary key default gen_random_uuid(),
  name varchar(150) not null unique,
  created_at timestamptz not null default now()
);

insert into public.landesverbaende (name) values
  ('Badischer Fußballverband'),
  ('Bayerischer Fußball-Verband'),
  ('Fußball-Verband Berlin'),
  ('Fußball-Landesverband Brandenburg'),
  ('Bremer Fußball-Verband'),
  ('Hamburger Fußball-Verband'),
  ('Hessischer Fußball-Verband'),
  ('Fußballverband Mecklenburg-Vorpommern'),
  ('Niedersächsischer Fußballverband'),
  ('Fußballverband Mittelrhein'),
  ('Fußball- und Leichtathletik-Verband Westfalen'),
  ('Niederrheinischer Fußballverband'),
  ('Fußballverband Rheinland'),
  ('Saarländischer Fußballverband'),
  ('Sächsischer Fußball-Verband'),
  ('Fußballverband Sachsen-Anhalt'),
  ('Schleswig-Holsteinischer Fußballverband'),
  ('Südbadischer Fußballverband'),
  ('Württembergischer Fußballverband'),
  ('Thüringer Fußball-Verband')
on conflict (name) do nothing;

alter table public.landesverbaende enable row level security;

-- Jeder authentifizierte Nutzer darf die Liste lesen (nötig für das
-- Auswahlfeld in der Vereinsverwaltung) -- reine Stammdaten ohne
-- Personenbezug, keine Zugriffsbeschränkung nötig.
create policy "landesverbaende_select_all"
on public.landesverbaende
for select
to authenticated
using (true);

-- 2) Verein <-> Landesverband.
alter table public.clubs
  add column if not exists landesverband_id uuid references public.landesverbaende(id);

-- 3) Rolle 'landesverband' zulassen + eigener Landesverband-Bezug für
-- Landesverbands-Nutzer (analog zu club_id bei Vereins-Nutzern).
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('scout', 'clubadmin', 'admin', 'parent', 'landesverband'));

alter table public.users
  add column if not exists landesverband_id uuid references public.landesverbaende(id);

create or replace function public.current_user_landesverband_id()
returns uuid
language sql
security definer
stable
as $$
  select landesverband_id
  from public.users
  where id = auth.uid()
$$;

-- 4) handle_new_auth_user() um den Landesverband-Invite-Pfad erweitern.
-- Gleiche Anti-Spoofing-Absicherung wie beim Club-/Eltern-Invite-Pfad:
-- nur wirksam bei echtem Invite (new.invited_at gesetzt), nie über die
-- öffentliche signUp()-Route.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pending_club_name text := new.raw_user_meta_data ->> 'pending_club_name';
  pending_plan text := coalesce(new.raw_user_meta_data ->> 'pending_plan', 'start');
  pending_billing_interval text := coalesce(new.raw_user_meta_data ->> 'pending_billing_interval', 'monatlich');
  invited_club_id uuid := nullif(new.raw_user_meta_data ->> 'pending_club_id', '')::uuid;
  invited_role text := coalesce(new.raw_user_meta_data ->> 'pending_role', 'scout');
  invited_landesverband_id uuid := nullif(new.raw_user_meta_data ->> 'pending_landesverband_id', '')::uuid;
  new_club_id uuid;
  new_landesverband_id uuid;
  new_role text := 'scout';
begin
  if pending_club_name is not null and length(trim(pending_club_name)) > 0 then
    insert into public.clubs (name, plan, billing_interval)
    values (
      trim(pending_club_name),
      case when pending_plan in ('start', 'verein') then pending_plan else 'start' end,
      case when pending_billing_interval in ('monatlich', 'jaehrlich') then pending_billing_interval else 'monatlich' end
    )
    returning id into new_club_id;
    new_role := 'admin';
  elsif new.invited_at is not null and invited_role = 'parent' then
    new_club_id := null;
    new_role := 'parent';
  elsif new.invited_at is not null and invited_role = 'landesverband' and invited_landesverband_id is not null then
    new_club_id := null;
    new_landesverband_id := invited_landesverband_id;
    new_role := 'landesverband';
  elsif new.invited_at is not null and invited_club_id is not null and invited_role in ('scout', 'admin') then
    new_club_id := invited_club_id;
    new_role := invited_role;
  end if;

  insert into public.users (
    id,
    email,
    club_id,
    landesverband_id,
    role,
    has_youth_access,
    is_active
  )
  values (
    new.id,
    new.email,
    new_club_id,
    new_landesverband_id,
    new_role,
    false,
    true
  )
  on conflict (id) do nothing;

  if new_role = 'parent' then
    update public.talent_guardians
    set user_id = new.id, claimed_at = now()
    where email = new.email and user_id is null;
  end if;

  return new;
end;
$$;

-- 5) Eng geschnittene Lese-View für Landesverbands-Accounts: nur
-- freigegebene Talente der zugeordneten Vereine, nur unkritische
-- Kern-Stammdaten. Kein tags/status/upcoming_transfer_*/Scout-Berichte/
-- Risikobewertung/Körpermaße. Minderjährige nur mit eigener
-- Jugendschutz-Berechtigung sichtbar.
--
-- Bewusst ohne "with (security_invoker = true)", gleiche Begründung wie
-- talent_family_view: die View selbst ist die einzige Zugriffskontrolle,
-- nicht zusätzlich an talents_select_same_club gebunden (die ein
-- Landesverband-Account, ohne club_id, ohnehin nie erfüllen könnte).
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
  t.updated_at
from public.talents t
join public.clubs c on c.id = t.club_id
where c.landesverband_id = public.current_user_landesverband_id()
  and t.visibility_status = 'freigegeben'
  and (not t.is_minor or public.current_user_has_youth_access());

grant select on public.landesverband_talents_view to authenticated;
