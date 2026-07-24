create table if not exists public.talents (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id),
  created_by uuid references public.users(id),
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  birth_date date not null check (birth_date <= current_date),
  primary_position varchar(50) not null,
  secondary_position varchar(50),
  club_name_text varchar(200),
  team_name_text varchar(100),
  league_text varchar(150),
  country_text varchar(100),
  contract_status varchar(20) not null default 'unbekannt'
    check (contract_status in ('aktiv','auslaufend','vereinslos','unbekannt')),
  contract_end_date date,
  height_cm smallint check (height_cm between 100 and 230),
  weight_kg smallint check (weight_kg between 30 and 150),
  status varchar(20) not null default 'in_beobachtung'
    check (status in ('in_beobachtung','empfehlung','abgeschlossen','verloren')),
  is_minor boolean not null default false,
  visibility_status varchar(20) not null default 'privat'
    check (visibility_status in ('privat','freigegeben')),
  review_due_date date,
  deletion_scheduled_at date,
  tags jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_talents_club_status
  on public.talents(club_id, status);

create index if not exists idx_talents_club_position
  on public.talents(club_id, primary_position);

create or replace function public.set_talent_derived_fields()
returns trigger
language plpgsql
as $$
begin
  new.is_minor := (age(current_date, new.birth_date) < interval '18 years');
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_talents_derived on public.talents;

create trigger trg_talents_derived
before insert or update on public.talents
for each row execute function public.set_talent_derived_fields();