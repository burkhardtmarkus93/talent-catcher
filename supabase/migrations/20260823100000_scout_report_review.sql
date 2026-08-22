-- Freigabe-Kennzeichnung für Scout-Berichte durch Vereins-Admins
-- ("Chef-Scout-Freigabe"), rein informativ: die Risk-Engine
-- (lib/alerts/riskEngine.ts) bezieht Berichte unverändert unabhängig
-- vom Freigabestatus ein — mit dem Projektverantwortlichen abgestimmt,
-- um bestehendes Berechnungsverhalten nicht zu ändern. Bewusst keine
-- neue Rolle ("Chef-Scout") eingeführt, da das laut CLAUDE.md Kapitel 8
-- eine größere Architekturentscheidung wäre — Freigabe ist stattdessen
-- an die bestehende club_admin/admin-Berechtigung geknüpft.
alter table public.scout_reports
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references public.users(id);

-- Sicherheitsrelevanter Bugfix bei dieser Gelegenheit gefunden: Die
-- bestehende Policy (20260722213000_rls_extended.sql) erlaubte jeder/m
-- Nutzer/in mit Rolle 'admin' das Update JEDES Scout-Berichts in der
-- gesamten Tabelle — ohne jede club_id-Prüfung. Ein Vereins-Admin von
-- Verein A konnte damit (bei Kenntnis der Bericht-ID) auch Berichte zu
-- Talenten von Verein B verändern, ein klarer Verstoß gegen die sonst
-- überall geltende club_id-Mandantentrennung. Zusätzlich verglich die
-- Policy gegen den Rollenwert 'clubadmin' (ohne Unterstrich) statt des
-- tatsächlichen, im Code aber aktuell nirgends vergebenen Werts
-- 'club_admin' (siehe Role-Typ in lib/types.ts) — praktisch folgenlos,
-- da kein Nutzer diese Rolle hat, aber zur Konsistenz mit korrigiert.
-- Für die neue Freigabe-Funktion (Admin bestätigt fremden Bericht) ist
-- die club_id-Prüfung direkt notwendig, daher hier per neuer Migration
-- korrigiert statt die bestehende Migration nachträglich zu ändern.
drop policy if exists "scout_reports_update_author_or_admin" on public.scout_reports;

create policy "scout_reports_update_author_or_admin"
on public.scout_reports
for update
to authenticated
using (
  author_id = auth.uid()
  or (
    public.current_user_role() in ('admin', 'club_admin')
    and exists (
      select 1
      from public.talents t
      where t.id = scout_reports.talent_id
        and t.club_id = public.current_user_club_id()
    )
  )
)
with check (
  author_id = auth.uid()
  or (
    public.current_user_role() in ('admin', 'club_admin')
    and exists (
      select 1
      from public.talents t
      where t.id = scout_reports.talent_id
        and t.club_id = public.current_user_club_id()
    )
  )
);
