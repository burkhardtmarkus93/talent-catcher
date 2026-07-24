create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id),
  initiated_by uuid references public.users(id),
  source_filename varchar(255),
  file_type varchar(10)
    check (file_type in ('csv','xlsx')),
  column_mapping jsonb,
  status varchar(30) not null default 'laeuft'
    check (status in ('laeuft','abgeschlossen','fehlgeschlagen','teilweise_fehlgeschlagen')),
  total_rows integer not null default 0
    check (total_rows >= 0),
  imported_rows integer not null default 0
    check (imported_rows >= 0),
  error_rows integer not null default 0
    check (error_rows >= 0),
  error_report jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_import_jobs_club
  on public.import_jobs(club_id);