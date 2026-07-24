create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  risk_level varchar(10) not null check (risk_level in ('gruen','gelb','rot')),
  risk_score numeric(5,2) not null check (risk_score >= 0),
  triggered_reasons jsonb not null default '[]'::jsonb,
  is_hidden_gem boolean not null default false,
  is_current boolean not null default true,
  calculated_at timestamptz not null default now()
);

create unique index if not exists idx_alerts_one_current_per_talent
  on public.alerts(talent_id)
  where (is_current);

create index if not exists idx_alerts_talent_history
  on public.alerts(talent_id, calculated_at desc);