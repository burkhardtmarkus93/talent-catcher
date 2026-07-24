create table if not exists public.watchlist_talents (
  watchlist_id uuid not null references public.watchlists(id) on delete cascade,
  talent_id uuid not null references public.talents(id) on delete cascade,
  added_by uuid references public.users(id),
  added_at timestamptz not null default now(),
  primary key (watchlist_id, talent_id)
);

create index if not exists idx_watchlist_talents_talent
  on public.watchlist_talents(talent_id);