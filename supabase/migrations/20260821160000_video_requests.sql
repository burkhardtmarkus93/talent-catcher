-- Scouts sollen Talente/Erziehungsberechtigte gezielt zum Hochladen eines
-- Videos auffordern können, statt dass Uploads jederzeit unaufgefordert
-- möglich sind ("Spam"-Vermeidung: Scouts bekommen nur Videos, die sie
-- angefordert haben). video_requests ist eine reine Metadaten-Tabelle
-- (kein zusätzlicher Datenzugriff), additiv zur bestehenden
-- Video-/Consent-Infrastruktur (20260722204000_videos.sql,
-- 20260816010000_parent_guardian_access.sql).

create table if not exists public.video_requests (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  requested_by uuid references public.users(id),
  note text,
  status varchar(20) not null default 'offen'
    check (status in ('offen', 'erledigt')),
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

create index if not exists idx_video_requests_talent
  on public.video_requests(talent_id);

-- Höchstens eine offene Anfrage pro Talent gleichzeitig — verhindert
-- doppelte Anfragen und macht "gibt es eine offene Anfrage?" eindeutig.
create unique index if not exists uq_video_requests_open_per_talent
  on public.video_requests(talent_id)
  where status = 'offen';

alter table public.video_requests enable row level security;

-- Vereinsseite: Scouts/Admins des Vereins sehen alle Anfragen "ihrer"
-- Talente (gleiches Muster wie videos_select_same_club).
create policy "video_requests_select_same_club"
on public.video_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = video_requests.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

-- Anfrage stellen: Vereinsscope wie beim Video-Upload; für minderjährige
-- Talente zusätzlich Jugendschutz-Zugriff verlangt (gleiches
-- Sicherheitsniveau wie Eltern-Einladung/Einwilligung erteilen —
-- talent_guardians_insert_same_club, consent_records_insert_youth_access).
create policy "video_requests_insert_same_club"
on public.video_requests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talents t
    where t.id = video_requests.talent_id
      and t.club_id = public.current_user_club_id()
      and (not t.is_minor or public.current_user_has_youth_access())
  )
);

-- Zurückziehen: nur eine noch offene Anfrage desselben Vereins, damit
-- bereits erledigte Anfragen als Historie erhalten bleiben.
create policy "video_requests_delete_same_club"
on public.video_requests
for delete
to authenticated
using (
  status = 'offen'
  and exists (
    select 1
    from public.talents t
    where t.id = video_requests.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

-- Eltern-Seite: dürfen die Anfrage(n) für ihr eigenes Talent sehen
-- (gleiches Muster wie videos_select_own_child_guardian), damit die
-- Upload-Freischaltung im /parent-Portal begründet werden kann.
create policy "video_requests_select_guardian"
on public.video_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.talent_guardians g
    where g.talent_id = video_requests.talent_id
      and g.user_id = auth.uid()
      and g.claimed_at is not null
  )
);

-- Sobald tatsächlich ein Video hochgeladen wird, gilt jede offene Anfrage
-- für dieses Talent automatisch als erledigt — unabhängig davon, ob der
-- Upload über die Eltern-Seite oder direkt durch den Verein erfolgt.
-- SECURITY DEFINER, weil Eltern keine UPDATE-Policy auf video_requests
-- haben (Schreibzugriff darauf ist bewusst Vereinssache).
create or replace function public.fulfill_video_requests_on_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.video_requests
  set status = 'erledigt', fulfilled_at = now()
  where talent_id = new.talent_id
    and status = 'offen';
  return new;
end;
$$;

drop trigger if exists trg_fulfill_video_requests_on_upload on public.videos;
create trigger trg_fulfill_video_requests_on_upload
after insert on public.videos
for each row
execute function public.fulfill_video_requests_on_upload();
