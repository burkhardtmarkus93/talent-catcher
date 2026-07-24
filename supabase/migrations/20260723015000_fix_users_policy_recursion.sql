drop policy if exists "Nutzer sehen alle Nutzer ihres Mandanten"
on public.users;

create policy "Nutzer sehen alle Nutzer ihres Mandanten"
on public.users
for select
using (
  exists (
    select 1
    from public.users u_me
    where u_me.id = auth.uid()
      and u_me.club_id = users.club_id
  )
);