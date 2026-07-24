-- users policies konsolidieren und an echtes Rollenschema angleichen

drop policy if exists "Nutzer sehen alle Nutzer ihres Mandanten" on public.users;
drop policy if exists "Nutzer sehen eigenes Profil" on public.users;
drop policy if exists "Nutzer können ihr eigenes Profil aktualisieren" on public.users;
drop policy if exists "Nur Admin kann Rollen/Rechte anderer Nutzer verwalten" on public.users;
drop policy if exists "Nur Admin und Club-Admin können Nutzer einladen" on public.users;

create policy "Nutzer sehen eigenes Profil"
on public.users
for select
using (id = auth.uid());

create policy "Nutzer können ihr eigenes Profil aktualisieren"
on public.users
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Nur Admin kann andere Nutzer verwalten"
on public.users
for update
using (current_user_role() = 'admin')
with check (current_user_role() = 'admin');

create policy "Nur Admin kann Nutzer anlegen"
on public.users
for insert
with check (
  current_user_role() = 'admin'
  and club_id = current_user_club_id()
);