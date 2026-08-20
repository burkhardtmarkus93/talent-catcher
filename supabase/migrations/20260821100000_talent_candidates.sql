-- Spieler-Selbstregistrierung + Vorschlag an einen Verein (Phase 1,
-- vom Projektverantwortlichen freigegeben unter der Bedingung "nur unter
-- Einhaltung der Regeln"). Bewusst NICHT als Vermittlung zwischen
-- mehreren Vereinen/Scouts gebaut (das wäre Phase 2, siehe CLAUDE.md
-- Kapitel 4), sondern als Bewerbung bei genau einem vom Spieler selbst
-- gewählten Verein — strukturell dasselbe wie die bestehende manuelle
-- Talent-Anlage durch einen Scout, nur dass der erste Datenpunkt vom
-- Spieler selbst kommt. Kein neues Rollenkonzept ("DFB-Stützpunkt-
-- Koordinator" ist einfach der Scout/Admin des als Stützpunkt geführten
-- Vereins) — nutzt die bestehende vereins-gescopte RLS 1:1.
--
-- Jugendschutz: bei minderjährigen Registrierenden (aus dem Geburtsdatum
-- abgeleitet, gleiche Berechnung wie set_talent_derived_fields) ist eine
-- E-Mail-Adresse einer/eines Erziehungsberechtigten Pflicht. Der
-- Kandidat wird für den Verein erst sichtbar, nachdem diese Person die
-- Einladung tatsächlich bestätigt hat (nicht schon beim bloßen
-- Versenden der Einladung — siehe confirm_candidate_guardian_consent()
-- unten, aufgerufen aus app/auth/confirm/route.ts NACH erfolgreicher
-- verifyOtp()/exchangeCodeForSession(), nicht aus diesem Insert-Trigger
-- heraus, sonst würde jede beliebige, nicht verifizierte E-Mail-Adresse
-- ausreichen, um die Sperre zu umgehen).

-- 1) Kandidaten-Tabelle.
create table if not exists public.talent_candidates (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id),
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  birth_date date not null check (birth_date <= current_date),
  primary_position varchar(50) not null,
  contact_email varchar(255) not null,
  is_minor boolean not null default false,
  guardian_email varchar(255),
  guardian_user_id uuid references public.users(id),
  guardian_confirmed_at timestamptz,
  status varchar(30) not null default 'pending_review'
    check (status in (
      'pending_guardian_consent',
      'pending_review',
      'accepted',
      'declined'
    )),
  reviewed_by uuid references public.users(id),
  reviewed_at timestamptz,
  resulting_talent_id uuid references public.talents(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_talent_candidates_club_status
  on public.talent_candidates(club_id, status);

-- Vor jedem Insert: is_minor serverseitig berechnen (nie dem Client
-- vertrauen), Status unabhängig von Client-Eingaben erzwingen, alle
-- Review-/Guardian-Felder auf "unangefasst" zurücksetzen — dieselbe
-- Absicherung wie set_talent_derived_fields (20260722034500), nur mit
-- der zusätzlichen Guardian-Pflichtfeld-Prüfung, weil diese Tabelle
-- (anders als talents) auch von nicht angemeldeten Personen befüllt
-- werden können muss.
create or replace function public.set_candidate_derived_fields()
returns trigger
language plpgsql
as $$
begin
  new.is_minor := (age(current_date, new.birth_date) < interval '18 years');

  if new.is_minor and (new.guardian_email is null or length(trim(new.guardian_email)) = 0) then
    raise exception 'Bei minderjaehrigen Registrierenden ist die E-Mail-Adresse einer/eines Erziehungsberechtigten Pflicht.';
  end if;

  new.status := case when new.is_minor then 'pending_guardian_consent' else 'pending_review' end;
  new.guardian_user_id := null;
  new.guardian_confirmed_at := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.resulting_talent_id := null;

  return new;
end;
$$;

drop trigger if exists trg_candidate_derived on public.talent_candidates;
create trigger trg_candidate_derived
before insert on public.talent_candidates
for each row execute function public.set_candidate_derived_fields();

alter table public.talent_candidates enable row level security;

-- Öffentliches Formular: jede/r darf eine Kandidatur einreichen, auch
-- ohne Login. Der obige Trigger verhindert, dass dabei Status/Guardian-/
-- Review-Felder manipuliert werden können.
create policy "talent_candidates_insert_public"
on public.talent_candidates
for insert
to anon, authenticated
with check (true);

-- Sichtbar für Scouts/Admins des gewählten Vereins — aber erst, sobald
-- der Status nicht mehr "pending_guardian_consent" ist (bei Minder-
-- jährigen also erst nach bestätigter Einwilligung; siehe Kommentar
-- oben). Zusätzlich, wie überall sonst im Schema, doppelt abgesichert
-- über current_user_has_youth_access() für Minderjährige.
create policy "talent_candidates_select_same_club"
on public.talent_candidates
for select
to authenticated
using (
  club_id = public.current_user_club_id()
  and status <> 'pending_guardian_consent'
  and (not is_minor or public.current_user_has_youth_access())
);

-- Annehmen/Ablehnen: nur aus dem Status "pending_review" heraus, nur
-- durch Scouts/Admins des eigenen Vereins mit (bei Minderjährigen)
-- Jugendschutz-Berechtigung.
create policy "talent_candidates_update_review_same_club"
on public.talent_candidates
for update
to authenticated
using (
  club_id = public.current_user_club_id()
  and status = 'pending_review'
  and (not is_minor or public.current_user_has_youth_access())
)
with check (
  club_id = public.current_user_club_id()
  and status in ('accepted', 'declined')
  and (not is_minor or public.current_user_has_youth_access())
);

-- 2) Öffentliches Vereinsverzeichnis fürs Registrierungsformular: nur
-- id+Name aktiver Vereine, keine Plan-/Abrechnungs-/Landesverbandsdaten
-- (Datensparsamkeit gegenüber nicht angemeldeten Besucher:innen).
create or replace view public.public_club_directory as
select id, name
from public.clubs
where is_active = true;

grant select on public.public_club_directory to anon, authenticated;

-- 3) handle_new_auth_user() um den Guardian-Consent-Invite-Pfad
-- erweitern. Wird wie ein normaler Eltern-Invite behandelt (Rolle
-- 'parent', kein club_id) — ergibt inhaltlich Sinn, da dieselbe Person
-- ohnehin die Eltern-Rolle für das Talent ihres Kindes übernehmen soll,
-- falls/sobald der Verein die Kandidatur annimmt (siehe
-- lib/actions/candidates.ts::acceptTalentCandidate, das dafür
-- automatisch eine bereits bestätigte talent_guardians-Zeile anlegt).
-- WICHTIG: hier wird bewusst NICHT talent_candidates aktualisiert (das
-- würde bei jedem Invite-Versand passieren, nicht erst bei tatsächlicher
-- Bestätigung) — das übernimmt ausschließlich
-- confirm_candidate_guardian_consent() unten, aufgerufen erst nach
-- erfolgreicher Verifizierung.
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
  elsif new.invited_at is not null and invited_role in ('parent', 'candidate_guardian') then
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

-- 4) Wird NACH erfolgreicher Verifizierung eines Einladungslinks
-- aufgerufen (app/auth/confirm/route.ts), nie beim bloßen Versenden.
-- Verknüpft die soeben verifizierte E-Mail-Adresse mit allen offenen
-- Guardian-Consent-Kandidaturen für dieselbe Adresse. SECURITY DEFINER,
-- da frisch angemeldete Eltern-Accounts (kein club_id) sonst keine
-- RLS-Berechtigung auf talent_candidates hätten — bewusst eng gefasst:
-- wirkt ausschließlich auf Zeilen mit exakt passender guardian_email
-- und Status 'pending_guardian_consent', sonst no-op. Harmlos für alle
-- anderen Verifizierungs-Arten (Scout-/Admin-/normale Eltern-Invites,
-- Vereins-Signup) — dort gibt es i.d.R. keine passende Zeile.
create or replace function public.confirm_candidate_guardian_consent()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  verified_email text;
begin
  select lower(email) into verified_email from auth.users where id = auth.uid();

  if verified_email is null then
    return;
  end if;

  update public.talent_candidates
  set guardian_user_id = auth.uid(),
      guardian_confirmed_at = now(),
      status = 'pending_review'
  where lower(guardian_email) = verified_email
    and status = 'pending_guardian_consent';
end;
$$;

grant execute on function public.confirm_candidate_guardian_consent() to authenticated;
