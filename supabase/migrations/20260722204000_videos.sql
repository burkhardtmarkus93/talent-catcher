create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  uploaded_by uuid references public.users(id),
  storage_key varchar(500) not null,
  signed_url_expires_at timestamptz,
  file_format varchar(10) not null default 'mp4'
    check (file_format in ('mp4')),
  codec varchar(20) default 'h264',
  resolution varchar(20),
  file_size_bytes bigint check (file_size_bytes > 0 and file_size_bytes <= 157286400),
  duration_seconds integer check (duration_seconds > 0),
  consent_record_id uuid references public.consent_records(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_videos_talent
  on public.videos(talent_id);