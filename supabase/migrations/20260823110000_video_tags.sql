-- Zeitmarken auf Video-Highlights ("Video-Tagging"), z. B. "Tor",
-- "1v1 gewonnen", "Fehlpass" — für hauptamtliches Scouting-Personal, das
-- diese Art der Szenen-Markierung aus Tools wie Wyscout/Scout7 kennt
-- (siehe Zielgruppen-Priorisierung Profivereine/NLZ, CLAUDE.md Kapitel 1).
-- Bewusst nur für Vereins-Scouts/-Admins gedacht, nicht für Eltern/
-- Kandidaten — das ergibt sich hier automatisch daraus, dass der
-- Club-Join nur für Nutzer mit club_id (also nicht Rolle parent/player)
-- eine Zeile liefert.
--
-- Ein Video ist laut videos_target_check entweder talent- oder
-- candidate-gebunden (videos.talent_id XOR videos.candidate_id, siehe
-- Migration 20260822190000) — die Policies hier decken über den
-- coalesce(...)-Join beide Fälle gemeinsam ab, statt die Talent-/
-- Kandidaten-Policies von videos separat zu duplizieren.
create table if not exists public.video_tags (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos(id) on delete cascade,
  created_by uuid references public.users(id),
  timestamp_seconds integer not null check (timestamp_seconds >= 0),
  label varchar(200) not null check (char_length(btrim(label)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_video_tags_video
  on public.video_tags(video_id, timestamp_seconds);

alter table public.video_tags enable row level security;

create policy "video_tags_select_same_club"
on public.video_tags
for select
to authenticated
using (
  exists (
    select 1
    from public.videos v
    left join public.talents t on t.id = v.talent_id
    left join public.talent_candidates tc on tc.id = v.candidate_id
    join public.users u on u.club_id = coalesce(t.club_id, tc.club_id)
    where v.id = video_tags.video_id
      and u.id = auth.uid()
  )
);

create policy "video_tags_insert_same_club"
on public.video_tags
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.videos v
    left join public.talents t on t.id = v.talent_id
    left join public.talent_candidates tc on tc.id = v.candidate_id
    join public.users u on u.club_id = coalesce(t.club_id, tc.club_id)
    where v.id = video_tags.video_id
      and u.id = auth.uid()
  )
);

-- Bewusst nur die eigene Markierung löschbar (kein Admin-Override) —
-- kleinste sinnvolle Berechtigung für ein reines Komfort-Feature, siehe
-- CLAUDE.md Kapitel 5 (keine Funktionalität über den Bedarf hinaus).
create policy "video_tags_delete_own"
on public.video_tags
for delete
to authenticated
using (created_by = auth.uid());
