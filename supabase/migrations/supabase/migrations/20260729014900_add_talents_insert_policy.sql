-- add insert policy for public.talents so authenticated users can create
-- talents only for their own club and only as themselves

create policy "talents_insert_same_club"
on public.talents
for insert
to authenticated
with check (
  club_id = public.current_user_club_id()
  and created_by = auth.uid()
);
