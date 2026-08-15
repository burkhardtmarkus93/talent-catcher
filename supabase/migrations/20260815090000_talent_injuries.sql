-- Verletzungshistorie pro Talent: Datum, Art, voraussichtliche
-- Rückkehr, Notiz. Laut CLAUDE.md (Kapitel 3) gilt bei Unsicherheit
-- ueber Sensibilitaet einer Datenkategorie: im Zweifel als sensibel
-- behandeln — Verletzungs-/Gesundheitsdaten sind das eindeutig, eher
-- noch mehr als Koerpergroesse/Gewicht, die bereits hinter dem
-- Jugendschutz-Flag liegen (canSeeBodyData in
-- app/(dashboard)/talents/[talentId]/page.tsx). Deshalb hier nicht nur
-- clientseitig ausgeblendet, sondern direkt in der RLS-Policy erzwungen:
-- bei einem minderjaehrigen Talent muss current_user_has_youth_access()
-- wahr sein, sonst liefert die Policy keine Zeilen/erlaubt keinen
-- Insert. Bei volljaehrigen Talenten reicht wie ueberall sonst die
-- Vereinszugehoerigkeit, da Verletzungen dort keine Jugendschutz-Frage
-- sind.
--
-- Reine Beobachtungsnotiz (Phase 1 laut CLAUDE.md Kapitel 4), fliesst
-- bewusst NICHT automatisch in die Risk-Engine ein (lib/riskEngine.ts
-- unveraendert) — das waere eine eigene, groessere Produktentscheidung
-- und gehoert erst nach Ruecksprache dazu.
--
-- Kein Update, wie bei den anderen Beobachtungstabellen (talent_siblings,
-- videos): ein falscher Eintrag wird geloescht und neu angelegt.

create table if not exists public.talent_injuries (
  id uuid primary key default gen_random_uuid(),
  talent_id uuid not null references public.talents(id) on delete cascade,
  injury_type varchar(200) not null,
  injury_date date not null,
  expected_return_date date,
  note varchar(300),
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_talent_injuries_talent
  on public.talent_injuries(talent_id, injury_date desc);

alter table public.talent_injuries enable row level security;

create policy "talent_injuries_select_same_club"
on public.talent_injuries
for select
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = talent_injuries.talent_id
      and t.club_id = public.current_user_club_id()
      and (not t.is_minor or public.current_user_has_youth_access())
  )
);

create policy "talent_injuries_insert_same_club"
on public.talent_injuries
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talents t
    where t.id = talent_injuries.talent_id
      and t.club_id = public.current_user_club_id()
      and (not t.is_minor or public.current_user_has_youth_access())
  )
);

create policy "talent_injuries_delete_same_club"
on public.talent_injuries
for delete
to authenticated
using (
  exists (
    select 1
    from public.talents t
    where t.id = talent_injuries.talent_id
      and t.club_id = public.current_user_club_id()
      and (not t.is_minor or public.current_user_has_youth_access())
  )
);
