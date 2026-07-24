drop policy if exists "Nutzer sehen alle Nutzer ihres Mandanten" on public.users;
drop policy if exists "Nutzer sehen eigenes Profil" on public.users;
drop policy if exists "Nutzer können ihr eigenes Profil aktualisieren" on public.users;
drop policy if exists "Nur Admin kann Rollen/Rechte anderer Nutzer verwalten" on public.users;
drop policy if exists "Nur Admin kann andere Nutzer verwalten" on public.users;
drop policy if exists "Nur Admin und Club-Admin können Nutzer einladen" on public.users;
drop policy if exists "Nur Admin kann Nutzer anlegen" on public.users;

create policy "users_select_own"
on public.users
for select
using (id = auth.uid());

create policy "users_update_own"
on public.users
for update
using (id = auth.uid())
with check (id = auth.uid());