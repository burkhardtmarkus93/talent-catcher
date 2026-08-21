-- RLS-Regressionstests, ausgeführt gegen eine frische lokale Supabase-
-- Instanz in CI (.github/workflows/rls-tests.yml), NIEMALS gegen ein
-- echtes Projekt — das Skript legt Fixture-Daten an und committet sie
-- zwischendurch (für die Rollenwechsel-Transaktionen nötig).
--
-- Direkter Anlass: zwei reale, produktionswirksame Bugs, die erst durch
-- manuelles Testen entdeckt wurden (siehe Migration 20260821140000):
--   1) Gegenseitige Policy-Rekursion zwischen talents und
--      talent_guardians (42P17 bei jedem Eltern-Update).
--   2) Postgres verlangt für UPDATE zusätzlich SELECT-Sichtbarkeit, die
--      Eltern/Spieler bewusst nie hatten — betroffene Updates trafen
--      früher 0 Zeilen, ohne jede Fehlermeldung.
-- Test 4 unten bildet genau dieses Szenario nach. Ergänzt um die
-- wichtigsten weiteren Rollen-/Vereinsgrenzen (Jugendschutz-Gate auf
-- Video-Anfragen, Vereins-Isolation, Guardian-Schreibschutz,
-- Auto-Erfüllung von Video-Anfragen).

\set ON_ERROR_STOP on

-- ============================================================
-- 0) Fixture
-- ============================================================

begin;

insert into public.clubs (id, name) values
  ('a0000000-0000-0000-0000-000000000001', 'RLS-Test-Verein A'),
  ('a0000000-0000-0000-0000-000000000002', 'RLS-Test-Verein B');

-- auth.users braucht nur eine gültige id; public.users.id referenziert
-- darauf (on delete cascade), daher für jeden Test-Nutzer beide Zeilen.
insert into auth.users (id, email, aud, role) values
  ('b0000000-0000-0000-0000-000000000001', 'rls-admin-a@test.local', 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-000000000002', 'rls-scout-no-youth-a@test.local', 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-000000000003', 'rls-scout-youth-a@test.local', 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-000000000004', 'rls-scout-b@test.local', 'authenticated', 'authenticated'),
  ('b0000000-0000-0000-0000-000000000005', 'rls-guardian@test.local', 'authenticated', 'authenticated');

insert into public.users (id, email, club_id, role, has_youth_access, is_active) values
  ('b0000000-0000-0000-0000-000000000001', 'rls-admin-a@test.local', 'a0000000-0000-0000-0000-000000000001', 'admin', true, true),
  ('b0000000-0000-0000-0000-000000000002', 'rls-scout-no-youth-a@test.local', 'a0000000-0000-0000-0000-000000000001', 'scout', false, true),
  ('b0000000-0000-0000-0000-000000000003', 'rls-scout-youth-a@test.local', 'a0000000-0000-0000-0000-000000000001', 'scout', true, true),
  ('b0000000-0000-0000-0000-000000000004', 'rls-scout-b@test.local', 'a0000000-0000-0000-0000-000000000002', 'scout', true, true),
  ('b0000000-0000-0000-0000-000000000005', 'rls-guardian@test.local', null, 'parent', false, true);

insert into public.talents (id, club_id, created_by, first_name, last_name, birth_date, primary_position, is_minor, club_name_text) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'RlsMinor', 'TestTalent', '2012-01-01', 'ST', true, 'RLS-Test-Verein A'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'RlsAdult', 'TestTalent', '2000-01-01', 'ST', false, 'RLS-Test-Verein A');

insert into public.talent_guardians (talent_id, email, user_id, invited_by, claimed_at) values
  ('c0000000-0000-0000-0000-000000000002', 'rls-guardian@test.local', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', now());

commit;

-- ============================================================
-- Test 1: Scout ohne Jugendschutz-Zugriff darf für ein
-- minderjähriges Talent keine Video-Anfrage stellen.
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$
begin
  insert into public.video_requests (talent_id, requested_by, note)
  values ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'sollte abgelehnt werden');
  raise exception 'FAIL Test 1: Video-Anfrage fuer Minderjaehrigen ohne Jugendschutz-Zugriff haette RLS ablehnen muessen';
exception
  when insufficient_privilege then
    raise notice 'OK Test 1: Video-Anfrage ohne Jugendschutz-Zugriff korrekt abgelehnt';
end $$;
rollback;

-- ============================================================
-- Test 2: Scout MIT Jugendschutz-Zugriff darf die Anfrage stellen,
-- und der verknüpfte Guardian eines ANDEREN Talents darf sie nicht
-- sehen (Vereins-/Guardian-Scoping von video_requests).
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000003","role":"authenticated"}';
insert into public.video_requests (talent_id, requested_by, note)
values ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Test 2 fixture');
commit;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000005","role":"authenticated"}';
do $$
declare
  visible_count int;
begin
  select count(*) into visible_count
  from public.video_requests
  where talent_id = 'c0000000-0000-0000-0000-000000000001';

  if visible_count <> 0 then
    raise exception 'FAIL Test 2: Guardian eines anderen Talents sieht fremde Video-Anfrage (% Zeilen)', visible_count;
  end if;
  raise notice 'OK Test 2: Guardian-Scoping von video_requests korrekt';
end $$;
rollback;

-- Aufräumen der Test-2-Fixture (offene Anfrage für den nächsten Testlauf).
begin;
delete from public.video_requests where talent_id = 'c0000000-0000-0000-0000-000000000001';
commit;

-- ============================================================
-- Test 3: Verein B darf Talente von Verein A weder sehen noch
-- ändern (Mandantentrennung).
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000004","role":"authenticated"}';
do $$
declare
  visible_count int;
begin
  select count(*) into visible_count
  from public.talents
  where club_id = 'a0000000-0000-0000-0000-000000000001';

  if visible_count <> 0 then
    raise exception 'FAIL Test 3: Verein B sieht % Talent(e) von Verein A', visible_count;
  end if;
  raise notice 'OK Test 3: Vereins-Mandantentrennung auf talents korrekt';
end $$;
rollback;

-- ============================================================
-- Test 4: Regression für den historischen Bug (Migration
-- 20260821140000) — Guardian-Update über die RPC muss für den
-- verknüpften Guardian funktionieren und für einen unverknüpften
-- Nutzer abgelehnt werden. Deckt sowohl die frühere Policy-
-- Rekursion (42P17) als auch das stillschweigende 0-Zeilen-Update ab.
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000005","role":"authenticated"}';
select public.update_guardian_talent_club(
  'c0000000-0000-0000-0000-000000000002'::uuid,
  'Neuer Verein RLS-Test',
  'U19'
);
commit;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}';
do $$
declare
  actual_club_name text;
begin
  select club_name_text into actual_club_name
  from public.talents
  where id = 'c0000000-0000-0000-0000-000000000002';

  if actual_club_name is distinct from 'Neuer Verein RLS-Test' then
    raise exception 'FAIL Test 4: Guardian-Update hat club_name_text nicht persistiert (Wert: %)', actual_club_name;
  end if;
  raise notice 'OK Test 4a: Guardian-Update via RPC persistiert korrekt';
end $$;
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$
begin
  perform public.update_guardian_talent_club(
    'c0000000-0000-0000-0000-000000000002'::uuid,
    'Sollte abgelehnt werden',
    null
  );
  raise exception 'FAIL Test 4b: Unverknuepfter Nutzer konnte Guardian-Update fuer fremdes Talent ausfuehren';
exception
  when others then
    if sqlerrm like 'Kein Zugriff auf dieses Talent.%' then
      raise notice 'OK Test 4b: Unverknuepfter Nutzer korrekt abgelehnt';
    else
      raise exception 'FAIL Test 4b: unerwarteter Fehler statt Zugriffsverweigerung: %', sqlerrm;
    end if;
end $$;
rollback;

-- ============================================================
-- Test 5: Video-Upload erfüllt eine offene Video-Anfrage
-- automatisch (Trigger fulfill_video_requests_on_upload).
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000003","role":"authenticated"}';
insert into public.video_requests (id, talent_id, requested_by, note)
values ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'Test 5 fixture');
insert into public.videos (talent_id, uploaded_by, storage_key, file_size_bytes)
values (
  'c0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001/c0000000-0000-0000-0000-000000000001/rls-test.mp4',
  1000
);
commit;

do $$
declare
  request_status text;
begin
  select status into request_status
  from public.video_requests
  where id = 'd0000000-0000-0000-0000-000000000001';

  if request_status is distinct from 'erledigt' then
    raise exception 'FAIL Test 5: offene Video-Anfrage wurde durch Upload nicht automatisch erfuellt (Status: %)', request_status;
  end if;
  raise notice 'OK Test 5: Video-Upload erfuellt offene Anfrage automatisch';
end $$;

-- ============================================================
-- Aufräumen
-- ============================================================

begin;
delete from public.videos where talent_id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
delete from public.video_requests where talent_id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
delete from public.talent_guardians where talent_id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
delete from public.talents where id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
delete from public.users where id in (
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000005'
);
delete from auth.users where id in (
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000005'
);
delete from public.clubs where id in ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002');
commit;

\echo 'Alle RLS-Regressionstests erfolgreich.'
