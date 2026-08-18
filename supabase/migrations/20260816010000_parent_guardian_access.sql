-- Phase 1 (laut CLAUDE.md Kapitel 1/4 ausdrücklich vorgesehen: "Rollenmodell
-- ... für Eltern als Betrachter/Erfasser ihrer eigenen Daten"): Eltern
-- erhalten einen eigenen, verifizierten Account, der ausschließlich mit dem
-- einen Talent ihres Kindes verknüpft ist. Sie können Verein/Team pflegen
-- (Vereinswechsel, von dem der Scout ggf. noch nichts weiß) und Videos
-- hochladen/ansehen. Bewusst NICHT Teil davon: irgendeine Vermittlung/
-- Kontaktaufnahme zwischen Eltern und fremden Scouts — das wäre Phase 2
-- (Kapitel 4) und braucht erst eine gesonderte Freigabe nach rechtlicher
-- Prüfung (Vereinswechsel Minderjähriger, DFB-/FIFA-Vermittlerregeln).
--
-- Verifizierung: ein Elternteil bekommt nie einen offenen Anmelde-Link,
-- sondern wird von einem Scout/Admin des Vereins, der das Talent bereits
-- betreut, für genau dieses eine Talent per E-Mail eingeladen (gleiches
-- Supabase-Invite-Muster wie lib/actions/team.ts). Erst wer über diesen
-- Invite-Link ein Konto anlegt, wird als Guardian verknüpft.
--
-- Datenmodell-Entscheidung: Eltern bekommen KEINEN club_id und KEINE
-- generelle RLS-Policy auf public.talents — sonst würden sie über die
-- bestehenden vereins-gescopten Policies (die nur auf club_id prüfen,
-- nicht auf Rolle) automatisch alle Talente des Vereins sehen, nicht nur
-- ihr eigenes Kind. Stattdessen:
--   - Lesen ausschließlich über die neue, eng geschnittene View
--     talent_family_view (bewusst ohne security_invoker, damit sie nicht
--     zusätzlich an der vereins-gescopten talents-SELECT-Policy scheitert
--     — die View selbst ist die einzige Zugriffskontrolle und wählt nur
--     unkritische Spalten aus; interne Felder wie tags, status,
--     visibility_status, upcoming_transfer_* oder die Risikobewertung
--     [alerts] sind absichtlich nicht enthalten).
--   - Schreiben nur über eine neue, eng geschnittene UPDATE-Policy auf
--     talents plus einen Guard-Trigger, der bei Rolle 'parent' jede
--     Spalte außer club_name_text/team_name_text blockiert (gleiches
--     Prinzip wie guard_users_self_update() für die eigene users-Zeile).

-- 1) Rolle 'parent' zulassen.
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('scout', 'clubadmin', 'admin', 'parent'));

-- 2) Verknüpfungstabelle Talent <-> Erziehungsberechtigte(r).
create table if not exists public.talent_guardians (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  email varchar(255) not null,
  user_id uuid references public.users(id),
  invited_by uuid references public.users(id),
  invited_at timestamptz not null default now(),
  claimed_at timestamptz,
  unique (talent_id, email)
);

create index if not exists idx_talent_guardians_talent
  on public.talent_guardians(talent_id);
create index if not exists idx_talent_guardians_email
  on public.talent_guardians(email) where user_id is null;
create index if not exists idx_talent_guardians_user
  on public.talent_guardians(user_id) where user_id is not null;

alter table public.talent_guardians enable row level security;

create policy "talent_guardians_select_same_club"
on public.talent_guardians
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = talent_guardians.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

-- Zusätzlich zum Vereins-Match auch current_user_has_youth_access()
-- verlangt (nicht nur in lib/actions/guardians.ts::inviteGuardian
-- geprüft) — gleiches Absicherungsniveau wie
-- consent_records_insert_youth_access, da eine Eltern-Einladung genauso
-- sensibel ist: sie eröffnet einer plattformfremden Person Zugriff.
create policy "talent_guardians_insert_same_club"
on public.talent_guardians
for insert
to authenticated
with check (
  public.current_user_has_youth_access()
  and exists (
    select 1
    from public.talents t
    where t.id = talent_guardians.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "talent_guardians_select_own"
on public.talent_guardians
for select
to authenticated
using (user_id = auth.uid());

-- 3) handle_new_auth_user() um den Eltern-Invite-Pfad erweitern. Gleiche
-- Anti-Spoofing-Absicherung wie beim bestehenden Club-Invite-Pfad: nur
-- wirksam, wenn new.invited_at gesetzt ist (also über
-- auth.admin.inviteUserByEmail(), nie über die öffentliche
-- signUp()-Route) — sonst könnte sich jede Person per Selbstregistrierung
-- als 'parent' eintragen.
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
  new_club_id uuid;
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
  elsif new.invited_at is not null and invited_club_id is not null and invited_role in ('scout', 'admin') then
    new_club_id := invited_club_id;
    new_role := invited_role;
  end if;

  insert into public.users (
    id,
    email,
    club_id,
    role,
    has_youth_access,
    is_active
  )
  values (
    new.id,
    new.email,
    new_club_id,
    new_role,
    false,
    true
  )
  on conflict (id) do nothing;

  -- Alle offenen Guardian-Einladungen für diese E-Mail-Adresse claimen
  -- (unterstützt mehrere Kinder desselben Elternteils). Läuft nur bei
  -- echtem Invite, siehe new.invited_at-Prüfung oben — bei
  -- Selbstregistrierung (new.invited_at ist null) bleibt new_role
  -- 'scout' und diese Zeile hätte ohnehin nichts zu claimen, da niemand
  -- ohne echten Invite eine talent_guardians-Zeile mit dieser E-Mail
  -- bekommen haben kann.
  if new_role = 'parent' then
    update public.talent_guardians
    set user_id = new.id, claimed_at = now()
    where email = new.email and user_id is null;
  end if;

  return new;
end;
$$;

-- 4) Eng geschnittene Lese-View für Eltern: nur unkritische Stammdaten,
-- kein tags/status/visibility_status/upcoming_transfer_*/alerts. Bewusst
-- ohne "with (security_invoker = true)" — die View ist die einzige
-- Zugriffskontrolle (siehe Kommentar oben), nicht zusätzlich an die
-- vereins-gescopte talents-Policy gebunden, die Eltern (kein club_id)
-- ohnehin nie erfüllen könnten.
create or replace view public.talent_family_view as
select
  t.id,
  t.club_id,
  t.first_name,
  t.last_name,
  t.birth_date,
  t.primary_position,
  t.secondary_position,
  t.club_name_text,
  t.team_name_text,
  t.league_text,
  t.country_text,
  t.is_minor,
  t.updated_at
from public.talents t
join public.talent_guardians g on g.talent_id = t.id
where g.user_id = auth.uid()
  and g.claimed_at is not null;

grant select on public.talent_family_view to authenticated;

-- 5) Schreibzugriff: enge UPDATE-Policy plus Spalten-Guard.
create policy "talents_update_own_child_guardian"
on public.talents
for update
to authenticated
using (
  exists (
    select 1
    from public.talent_guardians g
    where g.talent_id = talents.id
      and g.user_id = auth.uid()
      and g.claimed_at is not null
  )
)
with check (
  exists (
    select 1
    from public.talent_guardians g
    where g.talent_id = talents.id
      and g.user_id = auth.uid()
      and g.claimed_at is not null
  )
);

create or replace function public.guard_guardian_talent_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() = 'parent' then
    if new.club_id is distinct from old.club_id
      or new.created_by is distinct from old.created_by
      or new.first_name is distinct from old.first_name
      or new.last_name is distinct from old.last_name
      or new.birth_date is distinct from old.birth_date
      or new.primary_position is distinct from old.primary_position
      or new.secondary_position is distinct from old.secondary_position
      or new.league_text is distinct from old.league_text
      or new.country_text is distinct from old.country_text
      or new.contract_status is distinct from old.contract_status
      or new.contract_end_date is distinct from old.contract_end_date
      or new.height_cm is distinct from old.height_cm
      or new.weight_kg is distinct from old.weight_kg
      or new.status is distinct from old.status
      or new.visibility_status is distinct from old.visibility_status
      or new.review_due_date is distinct from old.review_due_date
      or new.deletion_scheduled_at is distinct from old.deletion_scheduled_at
      or new.tags is distinct from old.tags
      or new.archived_at is distinct from old.archived_at
      or new.tinder_skala is distinct from old.tinder_skala
      or new.potenzial_skala is distinct from old.potenzial_skala
      or new.transfermarkt_url is distinct from old.transfermarkt_url
      or new.fupa_url is distinct from old.fupa_url
      or new.dfb_stuetzpunkt is distinct from old.dfb_stuetzpunkt
      or new.verbandsauswahl is distinct from old.verbandsauswahl
      or new.nationalmannschaft is distinct from old.nationalmannschaft
      or new.nlz is distinct from old.nlz
      or new.upcoming_transfer_club_text is distinct from old.upcoming_transfer_club_text
      or new.upcoming_transfer_note is distinct from old.upcoming_transfer_note
    then
      raise exception 'Eltern-Accounts duerfen nur Verein und Team aktualisieren.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_guardian_talent_update on public.talents;
create trigger trg_guard_guardian_talent_update
before update on public.talents
for each row
execute function public.guard_guardian_talent_update();

-- 5b) Eltern muessen sehen koennen, ob fuer ihr eigenes Kind bereits eine
-- Video-Einwilligung dokumentiert ist (lib/queries/consent.ts::
-- hasGrantedVideoConsent) -- sonst wuerde der Upload fuer sie IMMER als
-- gesperrt erscheinen, selbst wenn ein Scout die Einwilligung bereits
-- erteilt hat, weil consent_records_select_youth_access
-- (20260722213000_rls_extended.sql) current_user_has_youth_access()
-- verlangt, was bei Eltern-Accounts immer false ist. Nur SELECT -- das
-- Erteilen/Dokumentieren der Einwilligung bleibt bewusst Scout-/
-- Admin-Sache (siehe lib/actions/consent.ts), nicht Teil dieser Aenderung.
create policy "consent_records_select_guardian"
on public.consent_records
for select
to authenticated
using (
  exists (
    select 1
    from public.talent_guardians g
    where g.talent_id = consent_records.talent_id
      and g.user_id = auth.uid()
      and g.claimed_at is not null
  )
);

-- 6) Videos: Eltern duerfen Videos ihres Kindes sehen und hochladen,
-- gleiches Muster wie videos_select_same_club/videos_insert_same_club
-- (20260722211500_rls_core.sql / 20260815040000_videos_insert_policy.sql),
-- nur eben Guardian- statt vereinsgescopt.
create policy "videos_select_own_child_guardian"
on public.videos
for select
to authenticated
using (
  exists (
    select 1
    from public.talent_guardians g
    where g.talent_id = videos.talent_id
      and g.user_id = auth.uid()
      and g.claimed_at is not null
  )
);

create policy "videos_insert_own_child_guardian"
on public.videos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talent_guardians g
    where g.talent_id = videos.talent_id
      and g.user_id = auth.uid()
      and g.claimed_at is not null
  )
);

-- 7) Storage: Eltern duerfen in denselben club_id/talent_id-Ordner wie
-- der Verein hochladen/lesen (siehe VideoUploadForm.tsx fuer das
-- Pfadschema), aber nur fuer den Ordner ihres eigenen Kindes -- geprueft
-- per Join auf talent_guardians + talents, nicht per pauschalem
-- club_id-Vergleich wie bei storage_videos_*_same_club.
create policy "storage_videos_select_guardian"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'videos'
  and exists (
    select 1
    from public.talent_guardians g
    join public.talents t on t.id = g.talent_id
    where g.user_id = auth.uid()
      and g.claimed_at is not null
      and (storage.foldername(name))[1] = t.club_id::text
      and (storage.foldername(name))[2] = t.id::text
  )
);

create policy "storage_videos_insert_guardian"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'videos'
  and exists (
    select 1
    from public.talent_guardians g
    join public.talents t on t.id = g.talent_id
    where g.user_id = auth.uid()
      and g.claimed_at is not null
      and (storage.foldername(name))[1] = t.club_id::text
      and (storage.foldername(name))[2] = t.id::text
  )
);
