-- Korrektur der in 20260819100000_landesverband_role.sql geseedeten
-- Landesverband-Liste, wie in jenem Migrationskommentar bereits als
-- offen benannt ("Annäherung aus Trainingswissen, keine verifizierte
-- Quelle"). Per Websuche gegen mehrere unabhängige, sich deckende
-- Quellen abgeglichen (u. a. fussballbasis.de/landesverband,
-- shfv-kiel.de/dfb-landesverbaende — dfb.de und Wikipedia selbst waren
-- in dieser Sandbox durch den Netzwerk-Egress-Proxy nicht direkt
-- abrufbar, siehe PR-Beschreibung). Trotzdem: bitte bei Gelegenheit
-- zusätzlich manuell gegen dfb.de/ueber-uns/der-dfb/landes-
-- regionalverbaende gegenchecken, da keine der Quellen die primäre
-- DFB-eigene Seite war.
--
-- Per UPDATE (nicht DELETE+INSERT), damit eine bestehende
-- clubs.landesverband_id-Zuordnung über die id-Spalte hinweg gültig
-- bleibt, falls in der Zwischenzeit schon ein Verein zugeordnet wurde.

update public.landesverbaende set name = 'Berliner Fußball-Verband'
  where name = 'Fußball-Verband Berlin';

update public.landesverbaende set name = 'Landesfußballverband Mecklenburg-Vorpommern'
  where name = 'Fußballverband Mecklenburg-Vorpommern';

update public.landesverbaende set name = 'Fußball-Verband Mittelrhein'
  where name = 'Fußballverband Mittelrhein';

update public.landesverbaende set name = 'Fußballverband Niederrhein'
  where name = 'Niederrheinischer Fußballverband';

-- Fehlender 21. Landesverband (Regionalverband Südwest, neben
-- Saarländischer Fußballverband und Fußballverband Rheinland).
insert into public.landesverbaende (name) values
  ('Südwestdeutscher Fußballverband')
on conflict (name) do nothing;
