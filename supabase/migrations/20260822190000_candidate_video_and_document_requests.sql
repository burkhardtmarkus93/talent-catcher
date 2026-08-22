-- Erweiterung der Kandidaten-Bewerbung (talent_candidates, Migration
-- 20260821100000 ff.): ein Scout musste die Annahme-Entscheidung bisher
-- ausschließlich anhand der vom Bewerber selbst eingegebenen Stammdaten
-- treffen (Name, Geburtsdatum, Position, Kontakt) -- kein Video, keine
-- Vita, siehe Produkt-Rückfrage vom Projektverantwortlichen. Diese
-- Migration erlaubt beides bereits VOR der Annahme:
--
--   1) Video-Anfrage wie bei bestehenden Talenten (video_requests/
--      videos), nur zusätzlich auf talent_candidates zielbar --
--      weiterhin bewusst NUR auf Anfrage des Scouts (Anti-Spam-Prinzip
--      unverändert aus Migration 20260821160000).
--   2) Sportliche Vita: NEU, ungefragt jederzeit während 'pending_review'
--      hochladbar (kein Anfrage-Gate wie beim Video -- ein schriftlicher
--      Lebenslauf ist anders als ein Video kein Spam-Risiko und liegt
--      bei einer Bewerbung typischerweise ohnehin bereits vor). Nutzt die
--      bereits bestehende, bisher komplett ungenutzte public.documents-
--      Tabelle/den 'documents'-Storage-Bucket (Migration 20260722203500/
--      20260722210500) statt einer neuen Parallelstruktur.
--
-- ZUSÄTZLICH gefundener Bug (beim Nachbauen des documents-Gegenstücks zu
-- videos_insert_same_club entdeckt): public.documents hatte -- geprüft
-- gegen die echte DB -- nie eine INSERT-Policy für Vereinsseite, obwohl
-- die Storage-Policies (storage_documents_insert_same_club) das
-- Hochladen der Datei selbst längst erlauben. Exakt derselbe
-- Fehlerklasse wie bei videos vor Migration 20260815040000 -- wird hier
-- gleich mitbehoben.
--
-- Beide neuen Ziel-Spalten (talent_id ODER candidate_id, nie beides) statt
-- einer zweiten Parallel-Tabelle je Feature -- gleiche Überlegung wie bei
-- talent_edit_access_requests versus talent_candidates: hier aber bewusst
-- KEINE neue Tabelle, weil video_requests/videos/documents inhaltlich
-- exakt dieselbe Sache bleiben (ein Video/Dokument zu einer Person),
-- unabhängig davon, ob die Person schon offiziell als Talent geführt wird
-- oder noch Kandidat ist.
--
-- Die automatische Übernahme bereits während der Kandidatur hochgeladener
-- Videos/Dokumente in die normale Talent-Ansicht beim Annehmen ist NICHT
-- Teil dieser Migration, sondern von lib/actions/candidates.ts::
-- migrateCandidateUploadsToTalent() erledigt (Storage-Verschiebung per
-- Admin-Client, da für diese Tabellen bewusst keine UPDATE-Policy für
-- Vereinsmitglieder existiert).

-- 0) talent_candidates: der/die bestätigte Erziehungsberechtigte bzw.
-- der volljährige Bewerber selbst konnte die eigene Kandidatur bisher
-- gar nicht lesen (es gab bislang nur talent_candidates_select_same_club
-- für die Vereinsseite plus den öffentlichen, nicht angemeldeten
-- Insert) -- ohne diese Policy könnte die neue Kandidat:innen-Seite
-- (app/parent/candidates) nichts anzeigen.
create policy "talent_candidates_select_guardian"
on public.talent_candidates
for select
to authenticated
using (
  guardian_user_id = auth.uid()
  and guardian_confirmed_at is not null
);

-- 1) video_requests: talent_id optional, candidate_id ergänzen.
alter table public.video_requests alter column talent_id drop not null;
alter table public.video_requests
  add column if not exists candidate_id uuid references public.talent_candidates(id) on delete cascade;

alter table public.video_requests drop constraint if exists video_requests_target_check;
alter table public.video_requests add constraint video_requests_target_check
  check ((talent_id is not null) <> (candidate_id is not null));

drop index if exists uq_video_requests_open_per_talent;
create unique index if not exists uq_video_requests_open_per_talent
  on public.video_requests(talent_id)
  where status = 'offen' and talent_id is not null;

create unique index if not exists uq_video_requests_open_per_candidate
  on public.video_requests(candidate_id)
  where status = 'offen' and candidate_id is not null;

create policy "video_requests_insert_candidate_same_club"
on public.video_requests
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talent_candidates tc
    where tc.id = video_requests.candidate_id
      and tc.club_id = public.current_user_club_id()
      and tc.status = 'pending_review'
      and (not tc.is_minor or public.current_user_has_youth_access())
  )
);

create policy "video_requests_select_candidate_same_club"
on public.video_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.talent_candidates tc
    where tc.id = video_requests.candidate_id
      and tc.club_id = public.current_user_club_id()
  )
);

create policy "video_requests_delete_candidate_same_club"
on public.video_requests
for delete
to authenticated
using (
  status = 'offen'
  and exists (
    select 1
    from public.talent_candidates tc
    where tc.id = video_requests.candidate_id
      and tc.club_id = public.current_user_club_id()
  )
);

-- Sichtbar für die/den bestätigte(n) Erziehungsberechtigte(n) bzw. den
-- volljährigen Bewerber selbst (guardian_user_id -- siehe erweiterte
-- confirm_deferred_access_links() unten, deckt beide Fälle ab).
create policy "video_requests_select_candidate_guardian"
on public.video_requests
for select
to authenticated
using (
  exists (
    select 1
    from public.talent_candidates tc
    where tc.id = video_requests.candidate_id
      and tc.guardian_user_id = auth.uid()
      and tc.guardian_confirmed_at is not null
  )
);

-- 2) videos: talent_id optional, candidate_id ergänzen.
alter table public.videos alter column talent_id drop not null;
alter table public.videos
  add column if not exists candidate_id uuid references public.talent_candidates(id) on delete cascade;

alter table public.videos drop constraint if exists videos_target_check;
alter table public.videos add constraint videos_target_check
  check ((talent_id is not null) <> (candidate_id is not null));

create policy "videos_select_candidate_same_club"
on public.videos
for select
to authenticated
using (
  exists (
    select 1
    from public.talent_candidates tc
    join public.users u on u.club_id = tc.club_id
    where tc.id = videos.candidate_id
      and u.id = auth.uid()
  )
);

create policy "videos_insert_candidate_same_club"
on public.videos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talent_candidates tc
    join public.users u on u.club_id = tc.club_id
    where tc.id = videos.candidate_id
      and u.id = auth.uid()
  )
);

create policy "videos_select_candidate_guardian"
on public.videos
for select
to authenticated
using (
  exists (
    select 1
    from public.talent_candidates tc
    where tc.id = videos.candidate_id
      and tc.guardian_user_id = auth.uid()
      and tc.guardian_confirmed_at is not null
  )
);

-- INSERT bewusst zusätzlich auf status = 'pending_review' begrenzt
-- (anders als die SELECT-Policies oben, die auch nach einer Entscheidung
-- weiterhin lesbar bleiben sollen) -- verhindert, dass über einen alten
-- offenen Browser-Tab noch nach Annahme/Ablehnung hochgeladen wird.
create policy "videos_insert_candidate_guardian"
on public.videos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talent_candidates tc
    where tc.id = videos.candidate_id
      and tc.guardian_user_id = auth.uid()
      and tc.guardian_confirmed_at is not null
      and tc.status = 'pending_review'
  )
);

-- 3) documents: talent_id optional, candidate_id ergänzen -- UND die
-- fehlende Vereinsseiten-INSERT-Policy fürs bestehende talent_id-Feld
-- nachrüsten (siehe Bug-Hinweis oben).
alter table public.documents alter column talent_id drop not null;
alter table public.documents
  add column if not exists candidate_id uuid references public.talent_candidates(id) on delete cascade;

alter table public.documents drop constraint if exists documents_target_check;
alter table public.documents add constraint documents_target_check
  check ((talent_id is not null) <> (candidate_id is not null));

create policy "documents_insert_same_club"
on public.documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talents t
    join public.users u on u.club_id = t.club_id
    where t.id = documents.talent_id
      and u.id = auth.uid()
  )
);

create policy "documents_select_candidate_same_club"
on public.documents
for select
to authenticated
using (
  exists (
    select 1
    from public.talent_candidates tc
    join public.users u on u.club_id = tc.club_id
    where tc.id = documents.candidate_id
      and u.id = auth.uid()
  )
);

create policy "documents_insert_candidate_same_club"
on public.documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talent_candidates tc
    join public.users u on u.club_id = tc.club_id
    where tc.id = documents.candidate_id
      and u.id = auth.uid()
  )
);

create policy "documents_select_candidate_guardian"
on public.documents
for select
to authenticated
using (
  exists (
    select 1
    from public.talent_candidates tc
    where tc.id = documents.candidate_id
      and tc.guardian_user_id = auth.uid()
      and tc.guardian_confirmed_at is not null
  )
);

-- Gleiche Begründung wie bei videos_insert_candidate_guardian oben:
-- INSERT nur während 'pending_review', SELECT bleibt unbegrenzt.
create policy "documents_insert_candidate_guardian"
on public.documents
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talent_candidates tc
    where tc.id = documents.candidate_id
      and tc.guardian_user_id = auth.uid()
      and tc.guardian_confirmed_at is not null
      and tc.status = 'pending_review'
  )
);

-- 4) Storage: Vereinsseite ist bereits generisch genug (prüft nur
-- club_id als erstes Pfadsegment, siehe storage_videos_*_same_club/
-- storage_documents_*_same_club aus 20260722213000) -- funktioniert
-- unverändert für Kandidaten-Pfade "club_id/candidate-<id>/...". Nur die
-- Guardian-Storage-Policies fehlen noch, da diese bisher ausschließlich
-- über talent_guardians+talents prüfen (existiert für eine Kandidatur
-- naturgemäß nicht).
create policy "storage_videos_select_candidate_guardian"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'videos'
  and exists (
    select 1
    from public.talent_candidates tc
    where tc.guardian_user_id = auth.uid()
      and tc.guardian_confirmed_at is not null
      and (storage.foldername(name))[1] = tc.club_id::text
      and (storage.foldername(name))[2] = 'candidate-' || tc.id::text
  )
);

create policy "storage_videos_insert_candidate_guardian"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'videos'
  and exists (
    select 1
    from public.talent_candidates tc
    where tc.guardian_user_id = auth.uid()
      and tc.guardian_confirmed_at is not null
      and (storage.foldername(name))[1] = tc.club_id::text
      and (storage.foldername(name))[2] = 'candidate-' || tc.id::text
  )
);

create policy "storage_documents_select_candidate_guardian"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.talent_candidates tc
    where tc.guardian_user_id = auth.uid()
      and tc.guardian_confirmed_at is not null
      and (storage.foldername(name))[1] = tc.club_id::text
      and (storage.foldername(name))[2] = 'candidate-' || tc.id::text
  )
);

create policy "storage_documents_insert_candidate_guardian"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'documents'
  and exists (
    select 1
    from public.talent_candidates tc
    where tc.guardian_user_id = auth.uid()
      and tc.guardian_confirmed_at is not null
      and (storage.foldername(name))[1] = tc.club_id::text
      and (storage.foldername(name))[2] = 'candidate-' || tc.id::text
  )
);

-- 5) fulfill_video_requests_on_upload(): jetzt auch für candidate_id-Ziel.
create or replace function public.fulfill_video_requests_on_upload()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.talent_id is not null then
    update public.video_requests
    set status = 'erledigt', fulfilled_at = now()
    where talent_id = new.talent_id
      and status = 'offen';
  elsif new.candidate_id is not null then
    update public.video_requests
    set status = 'erledigt', fulfilled_at = now()
    where candidate_id = new.candidate_id
      and status = 'offen';
  end if;
  return new;
end;
$$;

-- 6) confirm_deferred_access_links(): auch volljährige Selbst-
-- registrierungen verknüpfen (bisher nur guardian_email/Minderjährige --
-- siehe Bug-Hinweis in lib/candidateGuardianAccess.ts-Anpassung/Webhook-
-- Fix im selben Arbeitsschritt: ohne diese Erweiterung würde eine
-- erfolgte Einladung als 'player' nie mit der Kandidatur verknüpft, die
-- sie ausgelöst hat).
create or replace function public.confirm_deferred_access_links()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  verified_email text;
begin
  select lower(email) into verified_email from auth.users where id = auth.uid();

  if verified_email is null then
    return;
  end if;

  update public.talent_candidates
  set guardian_user_id = auth.uid(),
      guardian_confirmed_at = now(),
      status = case when status = 'pending_guardian_consent' then 'pending_review' else status end
  where (
      (guardian_email is not null and lower(guardian_email) = verified_email)
      or (guardian_email is null and lower(contact_email) = verified_email)
    )
    and guardian_user_id is null
    and resulting_talent_id is null;

  update public.talent_guardians
  set user_id = auth.uid(),
      claimed_at = now()
  where lower(email) = verified_email
    and user_id is null;
end;
$$;
