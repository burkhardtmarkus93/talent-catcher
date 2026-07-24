alter table public.users enable row level security;
alter table public.talents enable row level security;
alter table public.watchlists enable row level security;
alter table public.documents enable row level security;
alter table public.videos enable row level security;

create policy "users_select_same_club"
on public.users
for select
to authenticated
using (
  club_id = (
    select u.club_id
    from public.users u
    where u.id = auth.uid()
  )
);

create policy "talents_select_same_club"
on public.talents
for select
to authenticated
using (
  club_id = (
    select u.club_id
    from public.users u
    where u.id = auth.uid()
  )
);

create policy "watchlists_select_same_club"
on public.watchlists
for select
to authenticated
using (
  club_id = (
    select u.club_id
    from public.users u
    where u.id = auth.uid()
  )
);

create policy "documents_select_same_club"
on public.documents
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    join public.users u
      on u.club_id = t.club_id
    where t.id = documents.talent_id
      and u.id = auth.uid()
  )
);

create policy "videos_select_same_club"
on public.videos
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    join public.users u
      on u.club_id = t.club_id
    where t.id = videos.talent_id
      and u.id = auth.uid()
  )
);