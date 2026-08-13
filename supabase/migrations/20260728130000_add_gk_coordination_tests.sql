-- Eigenständiges Torwart-Koordinationsmodul (fachlich inspiriert vom
-- DFB-/Uni-Tübingen-Konzept "ballgebundene Koordination bei Torhütern",
-- mit eigenständig entworfenen Übungen und eigener Punktelogik, um
-- keine urheberrechtlich geschützten Testinhalte zu übernehmen).
-- Nur relevant für Talente mit primary_position = 'TW'.

create table if not exists public.gk_coordination_tests (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  tester_id uuid references public.users(id),
  test_date date not null default current_date,

  -- automatisch abgeleitet, nicht manuell eingegeben (siehe Trigger unten)
  age_category varchar(3),

  score_wechselwurf smallint check (score_wechselwurf >= 0),
  score_kreuzprellen smallint check (score_kreuzprellen >= 0),
  score_wandreaktion smallint check (score_wandreaktion >= 0),
  score_doppelwandwurf smallint check (score_doppelwandwurf >= 0),
  score_wurfdrehung smallint check (score_wurfdrehung between 0 and 3),
  score_doppeldrehung smallint check (score_doppeldrehung >= 0),

  total_score numeric(5,1),
  created_at timestamptz not null default now(),

  constraint chk_gk_test_valid_age_category
    check (age_category in ('U11','U12','U13','U14','U15') or age_category is null)
);

create index if not exists idx_gk_coordination_tests_talent
  on public.gk_coordination_tests(talent_id, test_date desc);

create or replace function public.set_gk_test_derived_fields()
returns trigger
language plpgsql
as $$
declare
  talent_birth_year int;
  spieljahr_start_year int;
  u_number int;
begin
  select extract(year from birth_date)::int into talent_birth_year
  from public.talents
  where id = new.talent_id;

  -- DFB-Spieljahr beginnt am 1. Juli. Die Jahrgangszuordnung gilt
  -- fuer die gesamte Saison, unabhaengig vom exakten Geburtsmonat
  -- (so wie es NLZ-/Profi-Scouts gewohnt sind: "ein 2015er", nicht
  -- exaktes Lebensalter).
  if extract(month from new.test_date) >= 7 then
    spieljahr_start_year := extract(year from new.test_date)::int;
  else
    spieljahr_start_year := extract(year from new.test_date)::int - 1;
  end if;

  u_number := spieljahr_start_year - talent_birth_year + 1;

  new.age_category := case
    when u_number = 11 then 'U11'
    when u_number = 12 then 'U12'
    when u_number = 13 then 'U13'
    when u_number = 14 then 'U14'
    when u_number = 15 then 'U15'
    else null
  end;

  new.total_score := (
    coalesce(new.score_wechselwurf, 0)
    + coalesce(new.score_kreuzprellen, 0)
    + coalesce(new.score_wandreaktion, 0)
    + coalesce(new.score_doppelwandwurf, 0)
    + coalesce(new.score_wurfdrehung, 0)
    + coalesce(new.score_doppeldrehung, 0)
  );

  return new;
end;
$$;

drop trigger if exists trg_gk_test_derived on public.gk_coordination_tests;
create trigger trg_gk_test_derived
before insert or update on public.gk_coordination_tests
for each row execute function public.set_gk_test_derived_fields();

comment on column public.gk_coordination_tests.age_category is
  'Automatisch abgeleitet aus Geburtsjahrgang und Spieljahr (1. Juli-Stichtag), nicht aus exaktem Alter. Entspricht der in NLZ/Profi-Scouting ueblichen Jahrgangslogik.';

-- RLS: neue Tabelle, daher zwingend erforderlich (anders als bei den
-- TINDER-Feldern, die nur bestehende Spalten waren)
alter table public.gk_coordination_tests enable row level security;

create policy "gk_coordination_tests_select_same_club"
on public.gk_coordination_tests
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = gk_coordination_tests.talent_id
      and t.club_id = public.current_user_club_id()
  )
);

create policy "gk_coordination_tests_insert_same_club"
on public.gk_coordination_tests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talents t
    where t.id = gk_coordination_tests.talent_id
      and t.club_id = public.current_user_club_id()
  )
);
