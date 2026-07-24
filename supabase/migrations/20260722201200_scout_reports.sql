create table if not exists public.scout_reports (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  author_id uuid references public.users(id),
  observation_id uuid references public.observations(id),
  match_date date,
  opponent varchar(200),
  score_technik smallint not null check (score_technik between 1 and 5),
  score_taktik smallint not null check (score_taktik between 1 and 5),
  score_athletik smallint not null check (score_athletik between 1 and 5),
  score_mentalitaet smallint not null check (score_mentalitaet between 1 and 5),
  overall_rating numeric(3,1),
  overall_rating_source varchar(20) not null default 'calculated'
    check (overall_rating_source in ('calculated','manual_override')),
  overall_rating_override_reason varchar(300),
  comment text,
  created_at timestamptz not null default now(),
  check (
    overall_rating_source = 'calculated'
    or (overall_rating_source = 'manual_override' and overall_rating_override_reason is not null)
  )
);

create index if not exists idx_scout_reports_talent
  on public.scout_reports(talent_id, created_at desc);

create or replace function public.set_scout_report_rating()
returns trigger
language plpgsql
as $$
begin
  if new.overall_rating_source = 'calculated' then
    new.overall_rating := round(
      (new.score_technik
       + new.score_taktik
       + new.score_athletik
       + new.score_mentalitaet)::numeric / 4,
      1
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_scout_reports_rating on public.scout_reports;

create trigger trg_scout_reports_rating
before insert or update on public.scout_reports
for each row
execute function public.set_scout_report_rating();