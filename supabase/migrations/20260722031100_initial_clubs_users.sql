create extension if not exists pgcrypto;

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name varchar(200) not null,
  club_type varchar(20) not null default 'verein'
    check (club_type in ('verein', 'akademie')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  club_id uuid references public.clubs(id),
  email varchar(255) not null unique,
  role varchar(20) not null default 'scout'
    check (role in ('scout', 'clubadmin', 'admin')),
  has_youth_access boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_users_club on public.users(club_id);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    id,
    email,
    role,
    has_youth_access,
    is_active
  )
  values (
    new.id,
    new.email,
    'scout',
    false,
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();