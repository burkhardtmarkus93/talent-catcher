-- Team-Verwaltung für Vereins-Admins: eigene Vereinsmitglieder einsehen/
-- verwalten (Rolle ändern, Jugendschutz-Zugriff umschalten, deaktivieren)
-- sowie neue Mitglieder per E-Mail einladen.
--
-- RLS-Überlegung: Aktuell (siehe pg_policies, geprüft vor dieser Migration)
-- erlaubt public.users ausschließlich Zugriff auf die eigene Zeile
-- (users_select_own / users_update_own aus
-- 20260723020500_disable_recursive_users_policies.sql). Frühere Versuche,
-- "alle Nutzer desselben Vereins" sichtbar zu machen, wurden wegen RLS-
-- Rekursion wieder verworfen (siehe 20260723015000/20260723020500) — die
-- dort verwendete Policy fragte direkt und ohne SECURITY DEFINER wieder
-- public.users in ihrer eigenen USING-Klausel ab. Die hier neuen Policies
-- vermeiden das, indem sie ausschließlich die bereits bestehenden,
-- SECURITY DEFINER-STABLE-Funktionen current_user_club_id() /
-- current_user_role() nutzen (aus 20260722213000_rls_extended.sql,
-- bereits erfolgreich für clubs/talents/watchlists im Einsatz) statt
-- selbst erneut public.users abzufragen.
--
-- Zusätzlich zur SELECT-Policy: eine neue UPDATE-Policy, die Admins das
-- Ändern anderer Nutzer im eigenen Verein erlaubt. Die with-check-Klausel
-- erzwingt, dass club_id dabei immer beim eigenen Verein bleibt — ein
-- Admin kann also niemanden in einen anderen Verein verschieben. Die
-- Selbst-Änderung von role/club_id/has_youth_access bleibt weiterhin
-- durch guard_users_self_update() gesperrt (der Trigger feuert nur bei
-- auth.uid() = new.id, betrifft diese neue "Admin ändert andere"-Policy
-- also nicht).

create policy "users_select_club_admin"
on public.users
for select
to authenticated
using (
  club_id = public.current_user_club_id()
  and public.current_user_role() = 'admin'
);

create policy "users_update_club_admin"
on public.users
for update
to authenticated
using (
  club_id = public.current_user_club_id()
  and public.current_user_role() = 'admin'
)
with check (
  club_id = public.current_user_club_id()
  and public.current_user_role() = 'admin'
);

-- handle_new_auth_user() um einen zweiten, vertrauenswürdigen Pfad
-- erweitert: Admin-Invites über auth.admin.inviteUserByEmail() (Service-
-- Role-Client, siehe lib/actions/team.ts). Dabei wird pending_club_id/
-- pending_role in den user_metadata mitgegeben. Sicherheitsrelevant:
-- new.invited_at ist ausschließlich bei diesem Admin-Invite-Pfad gesetzt,
-- nie bei öffentlicher Selbstregistrierung über auth.signUp() (anon key).
-- Nur wenn invited_at gesetzt ist, wird die per Metadata übergebene
-- club_id/role übernommen — sonst könnte sich jede Person über die
-- öffentliche signUp()-Route selbst eine beliebige pending_club_id
-- mitgeben und sich damit in einen fremden Verein einschleusen, ohne je
-- einen echten Invite bekommen zu haben.
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

  return new;
end;
$$;
