alter table public.talents
add column if not exists archived_at timestamptz;

create index if not exists talents_archived_at_idx
on public.talents (archived_at);
