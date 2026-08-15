-- Watchlists waren bisher nur lesbar: public.watchlists hatte (geprüft
-- per pg_policies gegen die echte DB) nur watchlists_select_same_club
-- (20260722211500_rls_core.sql) — ohne INSERT-Policy konnte niemand über
-- den normalen, RLS-gebundenen Client eine neue Watchlist anlegen. Das
-- Frontend hatte bislang ohnehin keine echte Anlage-Funktion (nur
-- Dummy-Daten), daher ist die fehlende Policy bisher nicht aufgefallen.
--
-- watchlist_talents hat bereits SELECT/INSERT/DELETE
-- (20260722213000_rls_extended.sql) — dort fehlt nichts.

create policy "watchlists_insert_same_club"
on public.watchlists
for insert
to authenticated
with check (
  club_id = (
    select u.club_id
    from public.users u
    where u.id = auth.uid()
  )
);
