-- Verknüpfung eines Talents mit seinem Transfermarkt- bzw. FuPa-
-- Spielerprofil (reiner Link, kein Scraping/Embedding — siehe PR-
-- Beschreibung: Transfermarkt untersagt das Einbetten/Scrapen seiner
-- Daten in den eigenen Nutzungsbedingungen und blockiert Framing aktiv
-- per X-Frame-Options; bei FuPa ist die Rechtslage nicht sicher genug
-- geprüft, um es anders zu behandeln. Es wird daher nur die externe URL
-- gespeichert und als klar gekennzeichneter Link angezeigt).
--
-- RLS-Überlegung: Beide Spalten liegen auf public.talents, bereits durch
-- talents_select_same_club / talents_update_same_club (live auf der DB
-- geprüft, nicht nur über den Migrations-Verlauf — der für talents an
-- der Stelle unvollständig ist) auf den eigenen Verein beschränkt. Keine
-- neue Policy nötig.

alter table public.talents
  add column if not exists transfermarkt_url text,
  add column if not exists fupa_url text;
