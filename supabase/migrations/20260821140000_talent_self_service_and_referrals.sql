-- Drei zusammengehörige Erweiterungen der Spieler-Selbstregistrierung
-- (siehe #177/#178/#179), mit dem Projektverantwortlichen per Rückfrage
-- abgestimmt:
--
-- 1) "Bin ich schon als Talent gelistet?" — bewusst KEINE öffentlich
--    durchsuchbare Datenbank über (teils minderjährige) Talente. Die
--    Prüfung läuft ausschließlich als Teil eines echten
--    Registrierungsversuchs bei EINEM vom Spieler selbst gewählten
--    Verein (siehe talent_exists_at_club() unten) — kein
--    eigenständiges Suchfeld, keine Cross-Vereins-Auskunft.
--
-- 2) Bezahlte Selbstverwaltung eines bereits bestehenden Talent-Profils
--    (Vereinswechsel, Video-Upload) — bewusst als Erweiterung des
--    bestehenden, bereits gebauten und getesteten Eltern-Zugangs
--    (talent_guardians, Migration 20260816010000) statt einer neuen
--    Parallelstruktur: neue Spalte "relationship" unterscheidet
--    'guardian' (Erziehungsberechtigte/r eines minderjährigen Talents)
--    von 'self' (volljähriger Spieler verwaltet sein eigenes Profil).
--    Neue Rolle 'player' dafür (nicht 'parent' wiederverwendet, um die
--    Rollen-Semantik nicht zu verwässern) — teilt sich aber
--    Datenmodell/RLS/Views/Portal-Seiten vollständig mit der
--    bestehenden Eltern-Rolle, inklusive Video-Upload: das
--    Video-Consent-Gate (hasGrantedVideoConsent) greift ausschließlich
--    bei is_minor=true, und 'player'-Zugriff wird per Konstruktion nur
--    für aktuell volljährige Talente vergeben — kein zusätzliches
--    Risiko dadurch.
--
-- 3) Öffentliches Formular "Spieler schlägt seinen Amateurverein vor,
--    sich zu registrieren" — reine Ablage, kein automatischer
--    E-Mail-Versand (dafür fehlt die Infrastruktur), der
--    Projektverantwortliche sieht die Einträge direkt in Supabase und
--    kontaktiert den Verein manuell.

-- 0) BUGFIX (beim Testen der neuen 'player'-Rolle entdeckt, betrifft
-- aber unabhängig davon bereits die bestehende Eltern-Funktion "Verein/
-- Team aktualisieren" seit Migration 20260816010000 — dort offenbar nie
-- gegen echtes RLS getestet): talent_guardians_select_same_club und
-- talent_guardians_insert_same_club prüfen den Verein eines Talents per
-- direktem Subquery auf public.talents. Gleichzeitig prüft
-- talents_update_own_child_guardian (auf public.talents) per direktem
-- Subquery auf public.talent_guardians. Bei einem UPDATE auf talents
-- durch Eltern/Spieler entsteht dadurch ein Zyklus: talents-Policy →
-- talent_guardians-Policy → talents-Policy (erneut, während die
-- äußere talents-Policy noch ausgewertet wird) → Postgres-Fehler 42P17
-- "infinite recursion detected in policy for relation talents".
--
-- Fix: talent_club_id() als SECURITY DEFINER-Hilfsfunktion (liest
-- talents.club_id unter Umgehung von RLS, gleiches Prinzip wie
-- current_user_club_id() für public.users) — bricht den Zyklus, da
-- talent_guardians' Policies dadurch nicht mehr die RLS von talents
-- durchlaufen.
create or replace function public.talent_club_id(p_talent_id uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select club_id from public.talents where id = p_talent_id;
$$;

drop policy if exists "talent_guardians_select_same_club" on public.talent_guardians;
create policy "talent_guardians_select_same_club"
on public.talent_guardians
for select
to authenticated
using (
  public.talent_club_id(talent_guardians.talent_id) = public.current_user_club_id()
);

drop policy if exists "talent_guardians_insert_same_club" on public.talent_guardians;
create policy "talent_guardians_insert_same_club"
on public.talent_guardians
for insert
to authenticated
with check (
  public.current_user_has_youth_access()
  and public.talent_club_id(talent_guardians.talent_id) = public.current_user_club_id()
);

-- Zweiter Teil desselben Bugs: talents_update_own_child_guardian
-- erlaubt zwar formal das UPDATE, aber Postgres benötigt für UPDATE
-- zusätzlich SELECT-Sichtbarkeit auf die betroffenen Zeilen (um die
-- WHERE-Bedingung auszuwerten) — und eine solche SELECT-Policy für
-- Eltern/Spieler auf public.talents gibt es bewusst NICHT (siehe
-- talent_family_view-Kommentar in Migration 20260816010000: "die View
-- selbst ist die einzige Zugriffskontrolle"). Ohne SELECT-Policy sieht
-- das UPDATE schlicht 0 Zeilen — kein Fehler, die Änderung verpufft
-- einfach stillschweigend. Eine SELECT-Policy hinzuzufügen würde
-- interne Scouting-Felder (tags/status/Risikobewertung) direkt
-- zugänglich machen und damit genau die Absicht von
-- talent_family_view unterlaufen.
--
-- Fix: enge SECURITY DEFINER-Funktion statt direktem .update() auf
-- talents — prüft die Berechtigung explizit im Funktionskörper (exakt
-- dieselbe Bedingung wie talents_update_own_child_guardian) und
-- schreibt danach ausschließlich club_name_text/team_name_text, unter
-- Umgehung von RLS. lib/actions/guardians.ts::updateGuardianTalentClub
-- ruft ab jetzt diese Funktion auf statt direkt .from("talents").update().
create or replace function public.update_guardian_talent_club(
  p_talent_id uuid,
  p_club_name_text text,
  p_team_name_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.talent_guardians g
    where g.talent_id = p_talent_id
      and g.user_id = auth.uid()
      and g.claimed_at is not null
  ) then
    raise exception 'Kein Zugriff auf dieses Talent.';
  end if;

  update public.talents
  set club_name_text = p_club_name_text,
      team_name_text = p_team_name_text
  where id = p_talent_id;
end;
$$;

grant execute on function public.update_guardian_talent_club(uuid, text, text) to authenticated;

-- 1) Verhältnis-Spalte für talent_guardians.
alter table public.talent_guardians
  add column if not exists relationship varchar(20) not null default 'guardian'
    check (relationship in ('guardian', 'self'));

-- 2) Neue Rolle 'player'.
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check
  check (role in ('scout', 'clubadmin', 'admin', 'parent', 'landesverband', 'player'));

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
  elsif new.invited_at is not null and invited_role = 'player' then
    new_club_id := null;
    new_role := 'player';
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

-- 3) guard_guardian_talent_update(): jetzt auch für Rolle 'player'
-- aktiv (gleiche Spalten-Beschränkung wie bei Eltern — nur
-- club_name_text/team_name_text).
create or replace function public.guard_guardian_talent_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() in ('parent', 'player') then
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
      or new.eu_passport is distinct from old.eu_passport
      or new.upcoming_transfer_club_text is distinct from old.upcoming_transfer_club_text
      or new.upcoming_transfer_note is distinct from old.upcoming_transfer_note
    then
      raise exception 'Eltern-/Spieler-Accounts duerfen nur Verein und Team aktualisieren.';
    end if;
  end if;
  return new;
end;
$$;

-- 4) confirm_candidate_guardian_consent() -> confirm_deferred_access_links():
-- generischerer Name, da jetzt zusätzlich zu talent_candidates auch
-- unbestätigte talent_guardians-Verknüpfungen (relationship='self' aus
-- dem neuen Edit-Access-Kauf, siehe unten) NACH echter Verifizierung
-- bestätigt. Gleiches Prinzip: nur nach tatsächlichem Abschluss des
-- Einladungs-/Bestätigungslinks, nie beim bloßen Versenden.
drop function if exists public.confirm_candidate_guardian_consent();

create or replace function public.confirm_deferred_access_links()
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
      status = case when status = 'pending_guardian_consent' then 'pending_review' else status end
  where lower(guardian_email) = verified_email
    and guardian_user_id is null;

  update public.talent_guardians
  set user_id = auth.uid(),
      claimed_at = now()
  where lower(email) = verified_email
    and user_id is null;
end;
$$;

grant execute on function public.confirm_deferred_access_links() to authenticated;

-- 5) talent_exists_at_club(): reine Existenzprüfung, KEINE Datenrückgabe
-- außer boolean — bewusst so eng gefasst, um kein Auskunfts-Orakel über
-- Talente an anderen Vereinen oder über Details zu schaffen. Nur exakte
-- Übereinstimmung bei GENAU dem vom Aufrufer übergebenen Verein.
-- Archivierte Talente zählen bewusst nicht als "bereits gelistet" (der
-- Verein hat die Beobachtung eingestellt) — dafür würde stattdessen der
-- normale Registrierungsweg greifen.
create or replace function public.talent_exists_at_club(
  p_club_id uuid,
  p_first_name text,
  p_last_name text,
  p_birth_date date
)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.talents t
    where t.club_id = p_club_id
      and t.archived_at is null
      and lower(trim(t.first_name)) = lower(trim(p_first_name))
      and lower(trim(t.last_name)) = lower(trim(p_last_name))
      and t.birth_date = p_birth_date
  );
$$;

grant execute on function public.talent_exists_at_club(uuid, text, text, date) to anon, authenticated;

-- 6) Bezahlte Anfrage auf Selbstverwaltungs-Zugang zu einem bereits
-- bestehenden Talent-Profil. Eigene, schlanke Tabelle statt
-- Wiederverwendung von talent_candidates, da semantisch etwas anderes
-- (kein neues Talent, sondern Zugriff auf ein bestehendes) — gleiches
-- Zahlungs-/Trigger-Muster wie talent_candidates (Migration
-- 20260821120000/20260821130000).
create table if not exists public.talent_edit_access_requests (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  requester_email varchar(255) not null,
  guardian_email varchar(255),
  is_minor boolean not null default false,
  status varchar(20) not null default 'pending_payment'
    check (status in ('pending_payment', 'paid')),
  stripe_checkout_session_id text,
  paid_at timestamptz,
  amount_paid_cents integer,
  created_at timestamptz not null default now()
);

create index if not exists idx_talent_edit_access_requests_talent
  on public.talent_edit_access_requests(talent_id);

create or replace function public.set_edit_access_request_derived_fields()
returns trigger
language plpgsql
as $$
begin
  if new.is_minor and (new.guardian_email is null or length(trim(new.guardian_email)) = 0) then
    raise exception 'Bei minderjaehrigen Talenten ist die E-Mail-Adresse der/des Erziehungsberechtigten Pflicht.';
  end if;

  new.status := 'pending_payment';
  new.stripe_checkout_session_id := null;
  new.paid_at := null;
  new.amount_paid_cents := null;

  return new;
end;
$$;

drop trigger if exists trg_edit_access_request_derived on public.talent_edit_access_requests;
create trigger trg_edit_access_request_derived
before insert on public.talent_edit_access_requests
for each row execute function public.set_edit_access_request_derived_fields();

alter table public.talent_edit_access_requests enable row level security;

-- Öffentlicher Insert (gleiches Muster wie talent_candidates_insert_public).
-- Keine öffentliche SELECT-Policy — der Stripe-Webhook liest/schreibt
-- ausschließlich über den Admin-Client (service_role, umgeht RLS).
create policy "talent_edit_access_requests_insert_public"
on public.talent_edit_access_requests
for insert
to anon, authenticated
with check (true);

-- 7) Vereins-Empfehlungen: reine Ablage, kein öffentlicher Lesezugriff
-- (auch nicht für authenticated) — der Projektverantwortliche sieht die
-- Einträge direkt über die Supabase-Oberfläche/den service_role-Zugang
-- und nimmt manuell Kontakt zum vorgeschlagenen Verein auf. Bewusst
-- keine automatisierte E-Mail an fremde Vereine (Spam-/Vertrauensrisiko,
-- außerdem fehlt dafür noch ein echter Transaktions-E-Mail-Dienst).
create table if not exists public.club_referrals (
  id uuid primary key default gen_random_uuid(),
  referred_club_name varchar(200) not null,
  referred_club_contact_email varchar(255),
  referrer_name varchar(200) not null,
  referrer_email varchar(255) not null,
  note text,
  created_at timestamptz not null default now()
);

alter table public.club_referrals enable row level security;

create policy "club_referrals_insert_public"
on public.club_referrals
for insert
to anon, authenticated
with check (true);
