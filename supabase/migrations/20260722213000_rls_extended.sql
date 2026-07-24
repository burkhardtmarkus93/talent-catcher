create or replace function public.current_user_club_id()
returns uuid
language sql
security definer
stable
as $$
  select club_id
  from public.users
  where id = auth.uid()
$$;

create or replace function public.current_user_role()
returns varchar
language sql
security definer
stable
as $$
  select role
  from public.users
  where id = auth.uid()
$$;

create or replace function public.current_user_has_youth_access()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(has_youth_access, false)
  from public.users
  where id = auth.uid()
$$;

alter table public.clubs enable row level security;
alter table public.consent_records enable row level security;
alter table public.reminders enable row level security;
alter table public.observations enable row level security;
alter table public.scout_reports enable row level security;
alter table public.alerts enable row level security;
alter table public.import_jobs enable row level security;
alter table public.watchlist_talents enable row level security;

create policy "clubs_select_own_club"
on public.clubs
for select
to authenticated
using (id = public.current_user_club_id());

create policy "clubs_update_admin_only"
on public.clubs
for update
to authenticated
using (
  id = public.current_user_club_id()
  and public.current_user_role() = 'admin'
);

create policy "consent_records_select_youth_access"
on public.consent_records
for select
to authenticated
using (
  public.current_user_has_youth_access()
  and exists (
    select 1
    from public.talents t
    where t.id = consent_records.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "consent_records_insert_youth_access"
on public.consent_records
for insert
to authenticated
with check (
  public.current_user_has_youth_access()
  and exists (
    select 1
    from public.talents t
    where t.id = consent_records.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "reminders_select_same_club"
on public.reminders
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = reminders.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "reminders_insert_same_club"
on public.reminders
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talents t
    where t.id = reminders.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "reminders_update_same_club"
on public.reminders
for update
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = reminders.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "observations_select_same_club"
on public.observations
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = observations.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "observations_insert_same_club"
on public.observations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talents t
    where t.id = observations.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "observations_update_same_club"
on public.observations
for update
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = observations.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "scout_reports_select_same_club"
on public.scout_reports
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = scout_reports.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "scout_reports_insert_same_club"
on public.scout_reports
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talents t
    where t.id = scout_reports.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "scout_reports_update_author_or_admin"
on public.scout_reports
for update
to authenticated
using (
  author_id = auth.uid()
  or public.current_user_role() in ('admin', 'clubadmin')
);

create policy "alerts_select_same_club"
on public.alerts
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = alerts.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "import_jobs_select_admin_only"
on public.import_jobs
for select
to authenticated
using (
  club_id = public.current_user_club_id()
  and public.current_user_role() in ('admin', 'clubadmin')
);

create policy "import_jobs_insert_admin_only"
on public.import_jobs
for insert
to authenticated
with check (
  club_id = public.current_user_club_id()
  and public.current_user_role() in ('admin', 'clubadmin')
);

create policy "watchlist_talents_select_same_club"
on public.watchlist_talents
for select
to authenticated
using (
  exists (
    select 1
    from public.watchlists w
    where w.id = watchlist_talents.watchlist_id
      and w.club_id = public.current_user_club_id()
  )
);

create policy "watchlist_talents_insert_same_club"
on public.watchlist_talents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.watchlists w
    where w.id = watchlist_talents.watchlist_id
      and w.club_id = public.current_user_club_id()
  )
);

create policy "watchlist_talents_delete_same_club"
on public.watchlist_talents
for delete
to authenticated
using (
  exists (
    select 1
    from public.watchlists w
    where w.id = watchlist_talents.watchlist_id
      and w.club_id = public.current_user_club_id()
  )
);

create policy "storage_videos_select_same_club"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = public.current_user_club_id()::text
);

create policy "storage_videos_insert_same_club"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'videos'
  and (storage.foldername(name))[1] = public.current_user_club_id()::text
);

create policy "storage_documents_select_same_club"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = public.current_user_club_id()::text
);

create policy "storage_documents_insert_same_club"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = public.current_user_club_id()::text
);