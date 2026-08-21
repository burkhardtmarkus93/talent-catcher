-- Aufgedeckt durch den neuen lokalen RLS-Test-CI-Job (rls-tests.yml):
-- "permission denied for table video_requests" auf einer frischen
-- lokalen Supabase-Instanz, obwohl dieselbe Operation gegen das echte
-- gehostete Projekt anstandslos funktionierte.
--
-- Ursache: RLS-Policies allein reichen nicht — Postgres verlangt
-- zusätzlich ein GRANT auf die Tabelle für die jeweilige Rolle. Auf
-- gehosteten Supabase-Projekten übernimmt das ein plattformseitiger
-- Bootstrap beim Anlegen des Projekts: ALTER DEFAULT PRIVILEGES für die
-- Rolle "postgres" im Schema public gewährt anon/authenticated/
-- service_role automatisch Rechte auf alles, was danach neu angelegt
-- wird. Eine frische lokale Instanz via `supabase start` hat diesen
-- Bootstrap nicht — jede bisherige Migration in diesem Projekt hat sich
-- daher unbemerkt auf plattformspezifisches Verhalten statt auf
-- explizite GRANTs verlassen.
--
-- Fix an der Wurzel statt Tabelle für Tabelle: dieselbe
-- ALTER-DEFAULT-PRIVILEGES-Einstellung wie auf dem gehosteten Projekt
-- nachbilden, plus einmalig GRANT auf alle bereits bestehenden
-- Tabellen/Sequenzen/Funktionen. Auf dem gehosteten Projekt ist das ein
-- No-Op (dieselben Rechte sind dort schon vorhanden), auf einer
-- frischen lokalen Instanz bringt es sie auf denselben Stand.
-- Tatsächlicher Zugriff bleibt weiterhin ausschließlich durch RLS
-- bestimmt — GRANT ist notwendig, aber nicht hinreichend.

grant usage on schema public to anon, authenticated, service_role;

grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on routines to anon, authenticated, service_role;
