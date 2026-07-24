create table if not exists public.consent_records (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  scope varchar(30) not null
    check (scope in ('profil_sichtbarkeit','video_material','matching_dritte','externe_sichtbarkeit','sonstiges')),
  status varchar(20) not null default 'angefragt'
    check (status in ('angefragt','erteilt','widerrufen','abgelaufen')),
  requested_at timestamptz,
  granted_at timestamptz,
  revoked_at timestamptz,
  valid_until date,
  recorded_by uuid references public.users(id),
  evidence_document_id uuid,
  notes varchar(500),
  created_at timestamptz not null default now()
);

create index if not exists idx_consent_talent_scope_status
  on public.consent_records(talent_id, scope, status);