create table if not exists public.observations (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  scout_id uuid references public.users(id),
  triggered_by_reminder_id uuid references public.reminders(id),
  resulting_report_id uuid,
  observation_date date not null,
  context varchar(200),
  observation_status varchar(20) not null default 'geplant'
    check (observation_status in ('geplant','durchgefuehrt','ausgefallen')),
  created_at timestamptz not null default now()
);

create index if not exists idx_observations_talent
  on public.observations(talent_id);