create policy "talents_insert_same_club"
on public.talents
for insert
to authenticated
with check (
  club_id = public.current_user_club_id()
  and created_by = auth.uid()
);
