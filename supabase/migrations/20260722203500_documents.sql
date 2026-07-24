create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  uploaded_by uuid references public.users(id),
  storage_key varchar(500) not null,
  file_type varchar(20) not null
    check (file_type in ('pdf','docx','image','other')),
  file_size_bytes bigint check (file_size_bytes > 0),
  description varchar(300),
  consent_record_id uuid references public.consent_records(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_talent
  on public.documents(talent_id);