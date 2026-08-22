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
-- WICHTIG: der on_auth_user_created-Trigger (handle_new_auth_user(),
-- Migration 20260722031100) legt bei jedem auth.users-Insert bereits
-- automatisch eine public.users-Basiszeile an (role='scout', kein
-- club_id) — der folgende Insert muss das per ON CONFLICT überschreiben,
-- sonst schlägt er mit "duplicate key value violates ... users_pkey" fehl.
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
  ('b0000000-0000-0000-0000-000000000005', 'rls-guardian@test.local', null, 'parent', false, true)
on conflict (id) do update set
  email = excluded.email,
  club_id = excluded.club_id,
  role = excluded.role,
  has_youth_access = excluded.has_youth_access,
  is_active = excluded.is_active;

insert into public.talents (id, club_id, created_by, first_name, last_name, birth_date, primary_position, is_minor, club_name_text) values
  ('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'RlsMinor', 'TestTalent', '2012-01-01', 'ST', true, 'RLS-Test-Verein A'),
  ('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'RlsAdult', 'TestTalent', '2000-01-01', 'ST', false, 'RLS-Test-Verein A');

insert into public.talent_guardians (talent_id, email, user_id, invited_by, claimed_at) values
  ('c0000000-0000-0000-0000-000000000002', 'rls-guardian@test.local', 'b0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', now());

-- Zusätzliche Fixture für die Kandidaten-Video-/Vita-Erweiterung
-- (Migration 20260822190000). Eigener "player"-Nutzer für den
-- volljährigen Selbstregistrierungs-Fall, analog zu rls-guardian für
-- den Minderjährigen-Fall.
insert into auth.users (id, email, aud, role) values
  ('b0000000-0000-0000-0000-000000000006', 'rls-player@test.local', 'authenticated', 'authenticated');

insert into public.users (id, email, club_id, role, has_youth_access, is_active) values
  ('b0000000-0000-0000-0000-000000000006', 'rls-player@test.local', null, 'player', false, true)
on conflict (id) do update set
  email = excluded.email,
  club_id = excluded.club_id,
  role = excluded.role,
  has_youth_access = excluded.has_youth_access,
  is_active = excluded.is_active;

-- Zusätzliche Fixture für die Scout-Bericht-Freigabe (Migration
-- 20260823100000): ein zweiter Admin, aber in Verein B, um den dort
-- behobenen Mandantentrennungs-Bug (Admin konnte bislang vereinsübergreifend
-- Berichte aktualisieren) direkt zu testen.
insert into auth.users (id, email, aud, role) values
  ('b0000000-0000-0000-0000-000000000007', 'rls-admin-b@test.local', 'authenticated', 'authenticated');

insert into public.users (id, email, club_id, role, has_youth_access, is_active) values
  ('b0000000-0000-0000-0000-000000000007', 'rls-admin-b@test.local', 'a0000000-0000-0000-0000-000000000002', 'admin', true, true)
on conflict (id) do update set
  email = excluded.email,
  club_id = excluded.club_id,
  role = excluded.role,
  has_youth_access = excluded.has_youth_access,
  is_active = excluded.is_active;

insert into public.scout_reports (id, talent_id, author_id, match_date, score_technik, score_taktik, score_athletik, score_mentalitaet) values
  ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', '2026-08-01', 3, 3, 3, 3);

-- Zusätzliche Fixture für Video-Tagging (Migration 20260823110000):
-- eigenes Video, unabhängig von den Video-Anfrage-Fixtures in Test 5/9/11.
insert into public.videos (id, talent_id, uploaded_by, storage_key, file_size_bytes) values
  ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001/c0000000-0000-0000-0000-000000000001/rls-test-tags.mp4', 1000);

-- set_candidate_derived_fields() erzwingt bei INSERT status/guardian_*
-- unabhängig von den übergebenen Werten (siehe Migrationskommentar
-- 20260821120000) — deshalb hier bewusst nur die Grunddaten einfügen
-- und den bezahlten/bestätigten Zustand danach per UPDATE simulieren,
-- genau wie es der reale Zahlungs-/Bestätigungs-Ablauf tun würde.
insert into public.talent_candidates (id, club_id, first_name, last_name, birth_date, primary_position, contact_email, guardian_email) values
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'RlsCandMinor', 'TestCandidate', '2012-01-01', 'ST', 'rls-guardian@test.local', 'rls-guardian@test.local'),
  ('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'RlsCandAdult', 'TestCandidate', '2000-01-01', 'ST', 'rls-player@test.local', null);

update public.talent_candidates
set status = 'pending_review'
where id in ('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002');

update public.talent_candidates
set guardian_user_id = 'b0000000-0000-0000-0000-000000000005', guardian_confirmed_at = now()
where id = 'e0000000-0000-0000-0000-000000000001';

update public.talent_candidates
set guardian_user_id = 'b0000000-0000-0000-0000-000000000006', guardian_confirmed_at = now()
where id = 'e0000000-0000-0000-0000-000000000002';

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
-- Test 6: Kandidaten-Gegenstück zu Test 1 — Scout ohne Jugendschutz-
-- Zugriff darf für eine minderjährige Kandidatur keine Video-Anfrage
-- stellen (Migration 20260822190000).
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}';
do $$
begin
  insert into public.video_requests (candidate_id, requested_by, note)
  values ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'sollte abgelehnt werden');
  raise exception 'FAIL Test 6: Video-Anfrage fuer minderjaehrige Kandidatur ohne Jugendschutz-Zugriff haette RLS ablehnen muessen';
exception
  when insufficient_privilege then
    raise notice 'OK Test 6: Video-Anfrage fuer Kandidatur ohne Jugendschutz-Zugriff korrekt abgelehnt';
end $$;
rollback;

-- ============================================================
-- Test 7: für eine VOLLJÄHRIGE Kandidatur greift die Jugendschutz-
-- Sperre erwartungsgemäß NICHT — derselbe Scout wie in Test 6 darf
-- hier anfragen. Zusätzlich Vereins-Mandantentrennung auf
-- video_requests.candidate_id (Lese- und Schreibzugriff).
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}';
insert into public.video_requests (id, candidate_id, requested_by, note)
values ('d0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Test 7 fixture (volljaehrige Kandidatur, ohne Jugendschutz-Zugriff angelegt)');
commit;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000004","role":"authenticated"}';
do $$
declare
  visible_count int;
begin
  select count(*) into visible_count
  from public.video_requests
  where candidate_id = 'e0000000-0000-0000-0000-000000000002';

  if visible_count <> 0 then
    raise exception 'FAIL Test 7a: Verein B sieht Video-Anfrage einer Kandidatur von Verein A (% Zeilen)', visible_count;
  end if;
  raise notice 'OK Test 7a: Vereins-Mandantentrennung auf video_requests.candidate_id (SELECT) korrekt';
end $$;
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000004","role":"authenticated"}';
do $$
begin
  insert into public.video_requests (candidate_id, requested_by, note)
  values ('e0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 'sollte abgelehnt werden');
  raise exception 'FAIL Test 7b: Verein B konnte Video-Anfrage fuer Kandidatur von Verein A anlegen';
exception
  when insufficient_privilege then
    raise notice 'OK Test 7b: Video-Anfrage-Insert ueber Vereinsgrenze (candidate_id) korrekt abgelehnt';
end $$;
rollback;

-- ============================================================
-- Test 8: talent_candidates_select_guardian ist strikt auf die eigene,
-- bestätigte Kandidatur begrenzt — nicht auf irgendeine verknüpfte
-- Kandidatur einer anderen Person.
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000006","role":"authenticated"}';
do $$
declare
  own_count int;
  foreign_count int;
begin
  select count(*) into own_count from public.talent_candidates where id = 'e0000000-0000-0000-0000-000000000002';
  select count(*) into foreign_count from public.talent_candidates where id = 'e0000000-0000-0000-0000-000000000001';

  if own_count <> 1 then
    raise exception 'FAIL Test 8a: bestaetigte eigene Kandidatur nicht sichtbar (% Zeilen)', own_count;
  end if;
  if foreign_count <> 0 then
    raise exception 'FAIL Test 8b: fremde Kandidatur faelschlich sichtbar (% Zeilen)', foreign_count;
  end if;
  raise notice 'OK Test 8: talent_candidates_select_guardian korrekt auf die eigene, bestaetigte Kandidatur begrenzt';
end $$;
rollback;

-- ============================================================
-- Test 9: Guardian-Video-Upload für eine Kandidatur wird blockiert,
-- sobald der Verein bereits entschieden hat (status <> 'pending_review')
-- — Regressionstest für die in derselben Migration ergänzte
-- Defense-in-Depth-Bedingung in videos_insert_candidate_guardian.
-- ============================================================

begin;
update public.talent_candidates set status = 'declined' where id = 'e0000000-0000-0000-0000-000000000001';
commit;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000005","role":"authenticated"}';
do $$
begin
  insert into public.videos (candidate_id, uploaded_by, storage_key, file_size_bytes)
  values (
    'e0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001/candidate-e0000000-0000-0000-0000-000000000001/rls-test.mp4',
    1000
  );
  raise exception 'FAIL Test 9: Video-Upload nach bereits entschiedener Kandidatur haette RLS ablehnen muessen';
exception
  when insufficient_privilege then
    raise notice 'OK Test 9: Video-Upload nach Entscheidung korrekt abgelehnt';
end $$;
rollback;

begin;
update public.talent_candidates set status = 'pending_review' where id = 'e0000000-0000-0000-0000-000000000001';
commit;

-- ============================================================
-- Test 10: Regressionstest für den in derselben Migration gefundenen
-- Bug — public.documents hatte nie eine INSERT-Policy für die
-- Vereinsseite (talent_id-Ziel), obwohl die Storage-Policies das
-- Hochladen der Datei selbst längst erlaubten.
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}';
insert into public.documents (talent_id, uploaded_by, storage_key, file_type, file_size_bytes, description)
values (
  'c0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001/c0000000-0000-0000-0000-000000000002/rls-test.pdf',
  'pdf',
  1000,
  'RLS-Test'
);
commit;

do $$
declare
  inserted_count int;
begin
  select count(*) into inserted_count
  from public.documents
  where talent_id = 'c0000000-0000-0000-0000-000000000002';

  if inserted_count <> 1 then
    raise exception 'FAIL Test 10: documents_insert_same_club hat den Insert nicht zugelassen (% Zeilen)', inserted_count;
  end if;
  raise notice 'OK Test 10: documents_insert_same_club (vormals fehlende Policy) korrekt zugelassen';
end $$;

-- ============================================================
-- Test 11: fulfill_video_requests_on_upload() erfüllt auch eine
-- candidate_id-Anfrage automatisch (Kandidaten-Gegenstück zu Test 5).
-- Nutzt die in Test 7 bereits angelegte offene Anfrage (d...0002) für
-- dieselbe Kandidatur weiter — pro Kandidatur ist höchstens eine offene
-- Anfrage gleichzeitig erlaubt (uq_video_requests_open_per_candidate).
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000006","role":"authenticated"}';
insert into public.videos (candidate_id, uploaded_by, storage_key, file_size_bytes)
values (
  'e0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000001/candidate-e0000000-0000-0000-0000-000000000002/rls-test.mp4',
  1000
);
commit;

do $$
declare
  request_status text;
begin
  select status into request_status
  from public.video_requests
  where id = 'd0000000-0000-0000-0000-000000000002';

  if request_status is distinct from 'erledigt' then
    raise exception 'FAIL Test 11: offene Kandidaten-Video-Anfrage wurde durch Upload nicht automatisch erfuellt (Status: %)', request_status;
  end if;
  raise notice 'OK Test 11: Kandidaten-Video-Upload erfuellt offene Anfrage automatisch';
end $$;

-- ============================================================
-- Test 12: Regression für den in Migration 20260823100000 behobenen
-- Mandantentrennungs-Bug — ein Admin aus Verein B darf einen Scout-
-- Bericht aus Verein A NICHT freigeben/aktualisieren, ein Admin aus dem
-- richtigen Verein (A) hingegen schon.
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000007","role":"authenticated"}';
do $$
declare
  affected_rows int;
begin
  update public.scout_reports
  set reviewed_at = now(), reviewed_by = 'b0000000-0000-0000-0000-000000000007'
  where id = 'f0000000-0000-0000-0000-000000000001';
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'FAIL Test 12a: Admin aus fremdem Verein konnte Scout-Bericht aktualisieren (% Zeile(n))', affected_rows;
  end if;
  raise notice 'OK Test 12a: Admin aus fremdem Verein korrekt abgelehnt (0 Zeilen betroffen)';
end $$;
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}';
do $$
declare
  affected_rows int;
begin
  update public.scout_reports
  set reviewed_at = now(), reviewed_by = 'b0000000-0000-0000-0000-000000000001'
  where id = 'f0000000-0000-0000-0000-000000000001';
  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'FAIL Test 12b: Admin aus dem richtigen Verein konnte Scout-Bericht NICHT aktualisieren (% Zeile(n))', affected_rows;
  end if;
  raise notice 'OK Test 12b: Admin aus dem richtigen Verein korrekt zugelassen';
end $$;
rollback;

-- ============================================================
-- Test 13: Video-Tagging (Migration 20260823110000) — Vereins-Isolation
-- (Einfügen/Sehen) und "nur eigene Markierung löschbar".
-- ============================================================

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000004","role":"authenticated"}';
do $$
begin
  insert into public.video_tags (video_id, created_by, timestamp_seconds, label)
  values ('f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 30, 'sollte abgelehnt werden');
  raise exception 'FAIL Test 13a: Scout aus fremdem Verein konnte Zeitmarke einfuegen';
exception
  when insufficient_privilege then
    raise notice 'OK Test 13a: Zeitmarke aus fremdem Verein korrekt abgelehnt';
end $$;
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000003","role":"authenticated"}';
insert into public.video_tags (id, video_id, created_by, timestamp_seconds, label)
values ('f0000000-0000-0000-0000-000000000004', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003', 42, 'Tor');
commit;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000004","role":"authenticated"}';
do $$
declare
  visible_count int;
begin
  select count(*) into visible_count
  from public.video_tags
  where id = 'f0000000-0000-0000-0000-000000000004';

  if visible_count <> 0 then
    raise exception 'FAIL Test 13b: Scout aus fremdem Verein konnte Zeitmarke sehen (% Zeile(n))', visible_count;
  end if;
  raise notice 'OK Test 13b: Zeitmarke fuer fremden Verein korrekt unsichtbar';
end $$;
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}';
do $$
declare
  affected_rows int;
begin
  delete from public.video_tags where id = 'f0000000-0000-0000-0000-000000000004';
  get diagnostics affected_rows = row_count;

  if affected_rows <> 0 then
    raise exception 'FAIL Test 13c: Admin (nicht Ersteller) konnte fremde Zeitmarke loeschen (% Zeile(n))', affected_rows;
  end if;
  raise notice 'OK Test 13c: Zeitmarke ist korrekt nur fuer die/den Ersteller/in loeschbar';
end $$;
rollback;

begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"b0000000-0000-0000-0000-000000000003","role":"authenticated"}';
do $$
declare
  affected_rows int;
begin
  delete from public.video_tags where id = 'f0000000-0000-0000-0000-000000000004';
  get diagnostics affected_rows = row_count;

  if affected_rows <> 1 then
    raise exception 'FAIL Test 13d: Ersteller/in konnte eigene Zeitmarke NICHT loeschen (% Zeile(n))', affected_rows;
  end if;
  raise notice 'OK Test 13d: Ersteller/in kann eigene Zeitmarke loeschen';
end $$;
commit;

-- ============================================================
-- Aufräumen
-- ============================================================

begin;
delete from public.scout_reports where id = 'f0000000-0000-0000-0000-000000000001';
delete from public.video_tags where video_id = 'f0000000-0000-0000-0000-000000000002';
delete from public.videos where id = 'f0000000-0000-0000-0000-000000000002';
delete from public.documents where talent_id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
delete from public.videos where talent_id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
delete from public.video_requests where talent_id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
delete from public.videos where candidate_id in ('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002');
delete from public.video_requests where candidate_id in ('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002');
delete from public.talent_guardians where talent_id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
delete from public.talent_candidates where id in ('e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000002');
delete from public.talents where id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
delete from public.users where id in (
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000007'
);
delete from auth.users where id in (
  'b0000000-0000-0000-0000-000000000001',
  'b0000000-0000-0000-0000-000000000002',
  'b0000000-0000-0000-0000-000000000003',
  'b0000000-0000-0000-0000-000000000004',
  'b0000000-0000-0000-0000-000000000005',
  'b0000000-0000-0000-0000-000000000006',
  'b0000000-0000-0000-0000-000000000007'
);
delete from public.clubs where id in ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002');
commit;

\echo 'Alle RLS-Regressionstests erfolgreich.'
