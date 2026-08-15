-- Ermöglicht, dass ein Scout bei einem Talent vermerkt: "es gibt noch
-- ein(e) talentierte(n) Geschwister" — Name + Geburtsdatum + optionale
-- Notiz. Reine Beobachtungsdaten (Phase 1 laut CLAUDE.md Kapitel 4),
-- kein Talent-Datensatz für sich, solange das Geschwisterkind nicht
-- selbst als eigenes Talent angelegt wird (dafür gibt es im UI einen
-- Link, der /talents/new mit Name/Geburtsdatum vorausfüllt — bewusst
-- ohne automatische Verknüpfung zwischen den beiden Talent-Zeilen, das
-- wäre ein separater, größerer Schritt).
--
-- Eigene Tabelle statt zwei weiterer Spalten auf talents: ein Talent
-- kann mehr als ein talentiertes Geschwisterkind haben, und das Projekt
-- modelliert "gehört zu einem Talent, potenziell mehrfach" bereits
-- durchgängig so (videos, documents, consent_records) statt auf
-- talents draufzupacken.
--
-- RLS-Überlegung: gleiches Verein-Join-Muster wie videos_select_same_club
-- (20260722211500_rls_core.sql) — SELECT/INSERT/DELETE, kein UPDATE
-- (ein falscher Eintrag wird gelöscht und neu angelegt, nicht bearbeitet).

create table if not exists public.talent_siblings (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  first_name varchar(100) not null,
  last_name varchar(100) not null,
  birth_date date,
  note varchar(300),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_talent_siblings_talent
  on public.talent_siblings(talent_id);

alter table public.talent_siblings enable row level security;

create policy "talent_siblings_select_same_club"
on public.talent_siblings
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    join public.users u
      on u.club_id = t.club_id
    where t.id = talent_siblings.talent_id
      and u.id = auth.uid()
  )
);

create policy "talent_siblings_insert_same_club"
on public.talent_siblings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talents t
    join public.users u
      on u.club_id = t.club_id
    where t.id = talent_siblings.talent_id
      and u.id = auth.uid()
  )
);

create policy "talent_siblings_delete_same_club"
on public.talent_siblings
for delete
to authenticated
using (
  exists (
    select 1
    from public.talents t
    join public.users u
      on u.club_id = t.club_id
    where t.id = talent_siblings.talent_id
      and u.id = auth.uid()
  )
);
