create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  created_by uuid references public.users(id),
  due_date date not null,
  reason varchar(500),
  status varchar(20) not null default 'offen'
    check (status in ('offen','erledigt','ueberfaellig','storniert')),
  completed_at timestamptz,
  completed_by uuid references public.users(id),
  notification_sent_at timestamptz,
  is_system_generated boolean not null default false,
  created_at timestamptz not null default now(),
  check (completed_at is null or status in ('erledigt'))
);

create index if not exists idx_reminders_status_due
  on public.reminders(status, due_date);

create index if not exists idx_reminders_talent
  on public.reminders(talent_id);