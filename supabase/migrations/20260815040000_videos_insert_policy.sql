-- Video-Highlights hochladen: public.videos hatte bisher (geprüft per
-- pg_policies gegen die echte DB) nur eine SELECT-Policy
-- (videos_select_same_club aus 20260722211500_rls_core.sql) — ohne
-- INSERT-Policy konnte kein eingeloggter Nutzer über den normalen,
-- RLS-gebundenen Client eine Zeile einfügen. Gleiches Muster/Join wie
-- die bestehende SELECT-Policy, nur für INSERT.
--
-- Upload-Ablauf (siehe lib/actions/videos.ts, components/videos/
-- VideoUploadForm.tsx): Die Datei selbst geht direkt vom Browser in den
-- privaten 'videos'-Storage-Bucket (RLS dort bereits vorhanden,
-- storage_videos_insert_same_club aus 20260722213000_rls_extended.sql,
-- verlangt club_id als ersten Pfadsegment) — nicht über eine Server
-- Action, da Datei-Uploads bis 150 MB (siehe check-Constraint auf
-- videos.file_size_bytes) die Body-Size-Limits von Next.js Server
-- Actions/Vercel-Functions sprengen würden. Diese Migration betrifft nur
-- die anschließende Metadaten-Zeile in public.videos.

create policy "videos_insert_same_club"
on public.videos
for insert
to authenticated
with check (
  exists (
    select 1
    from public.talents t
    join public.users u
      on u.club_id = t.club_id
    where t.id = videos.talent_id
      and u.id = auth.uid()
  )
);
