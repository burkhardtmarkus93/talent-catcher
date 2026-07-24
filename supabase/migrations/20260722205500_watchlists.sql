create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id),
  owner_id uuid references public.users(id),
  name varchar(150) not null,
  description varchar(500),
  created_at timestamptz not null default now()
);