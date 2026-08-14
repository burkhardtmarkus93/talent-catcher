-- Selbstregistrierung (Sign-up) mit Plan-Wahl.
--
-- RLS-Überlegung für das neue Feld: plan/billing_interval liegen auf
-- public.clubs, das bereits vollständig durch clubs_select_own_club /
-- clubs_update_admin_only (aus 20260722213000_rls_extended.sql) auf den
-- eigenen Verein beschränkt ist. Keine neue Policy nötig.
--
-- Für die Vereinsanlage selbst brauchte es eigentlich eine neue INSERT-
-- Policy auf clubs — stattdessen läuft die Anlage über den bestehenden,
-- bereits als SECURITY DEFINER laufenden Trigger handle_new_auth_user()
-- (aus 20260722031100_initial_clubs_users.sql), erweitert um die beim
-- Sign-up übergebenen user_metadata (pending_club_name/-plan/-billing).
-- Das umgeht RLS kontrolliert an genau einer, bereits vertrauenswürdigen
-- Stelle, statt eine weitere offene INSERT-Policy auf clubs zu öffnen.
--
-- Beim Prüfen ist aufgefallen, dass die aktuell aktive Policy
-- "users_update_own" (aus 20260723020500_disable_recursive_users_
-- policies.sql: using (id = auth.uid()) with check (id = auth.uid()))
-- keinerlei Spalten einschränkt — jeder eingeloggte Nutzer könnte per
-- Update auf die eigene Zeile role, club_id und has_youth_access frei
-- setzen und sich damit selbst Rechte verleihen. Das ist unabhängig vom
-- Sign-up-Feature ein bestehendes Sicherheitsproblem und wird hier
-- zusätzlich per Trigger geschlossen.

alter table public.clubs
  add column if not exists plan varchar(20) not null default 'start'
    check (plan in ('start', 'verein', 'verband')),
  add column if not exists billing_interval varchar(20) not null default 'monatlich'
    check (billing_interval in ('monatlich', 'jaehrlich'));

-- handle_new_auth_user() neu definiert (nicht die alte Migration
-- verändert): legt bei vorhandenen pending_*-user_metadata zusätzlich
-- einen Verein an und ordnet den neuen Nutzer diesem direkt als 'admin'
-- zu. Ohne pending_club_name (z. B. zukünftige Einladungs-Flows)
-- verhält sich die Funktion wie bisher: club_id null, role 'scout'.
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
  new_club_id uuid;
begin
  if pending_club_name is not null and length(trim(pending_club_name)) > 0 then
    insert into public.clubs (name, plan, billing_interval)
    values (
      trim(pending_club_name),
      case when pending_plan in ('start', 'verein') then pending_plan else 'start' end,
      case when pending_billing_interval in ('monatlich', 'jaehrlich') then pending_billing_interval else 'monatlich' end
    )
    returning id into new_club_id;
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
    case when new_club_id is not null then 'admin' else 'scout' end,
    false,
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Sicherheitsfix: Selbst-Update auf role/club_id/has_youth_access sperren.
create or replace function public.guard_users_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     or new.club_id is distinct from old.club_id
     or new.has_youth_access is distinct from old.has_youth_access then
    raise exception 'Rolle, Vereinszuordnung und Jugendschutz-Berechtigung können nicht selbst geändert werden.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_users_self_update on public.users;

create trigger trg_guard_users_self_update
before update on public.users
for each row
when (auth.uid() = new.id)
execute function public.guard_users_self_update();
