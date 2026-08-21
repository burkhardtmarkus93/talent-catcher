-- Umstellung der Spieler-Selbstregistrierung für Minderjährige (siehe
-- 20260821100000_talent_candidates.sql): der Projektverantwortliche hat
-- entschieden, dass sich Minderjährige nicht mehr selbst eintragen,
-- sondern ausschließlich Erziehungsberechtigte ihr Kind direkt anmelden
-- dürfen — verbunden mit einem einmaligen, kostenpflichtigen Vertrag
-- (Preismodell-Entscheidung: einmalig statt Abo, geringerer
-- rechtlicher/technischer Aufwand). Ersetzt damit den bisherigen
-- "Kind trägt ein, Eltern bestätigen per E-Mail-Link"-Ablauf für
-- Minderjährige durch "Elternteil trägt ein und bezahlt direkt" —
-- der Zahlungsabschluss selbst ist jetzt der Vertrauensanker statt der
-- bloßen E-Mail-Bestätigung (stärkeres Signal: echtes Zahlungsmittel,
-- UND die einreichende Person ist von Anfang an der Elternteil selbst,
-- nicht erst nachträglich bestätigend).
--
-- WICHTIG (siehe PR-Beschreibung): Vertragstext/AGB/Widerrufsrecht für
-- diesen Verbrauchervertrag sind NICHT Teil dieser Migration oder des
-- zugehörigen Codes — das erfordert juristische Prüfung vor
-- Live-Schaltung (Fernabsatzrecht bei Verträgen mit Verbrauchern).
--
-- Alter Status 'pending_guardian_consent' bleibt als gültiger Wert
-- erhalten (nicht entfernt, additive Migration), wird von neuem Code
-- aber nicht mehr erzeugt.

alter table public.talent_candidates
  add column if not exists stripe_checkout_session_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists amount_paid_cents integer;

alter table public.talent_candidates drop constraint if exists talent_candidates_status_check;
alter table public.talent_candidates add constraint talent_candidates_status_check
  check (status in (
    'pending_guardian_consent',
    'pending_payment',
    'pending_review',
    'accepted',
    'declined'
  ));

-- Trigger: bei Minderjährigen jetzt 'pending_payment' statt
-- 'pending_guardian_consent' erzwingen; Zahlungsfelder bei jedem Insert
-- ebenfalls unabhängig von Client-Eingaben zurücksetzen (gleiches
-- Prinzip wie die bereits bestehenden Review-/Guardian-Felder).
create or replace function public.set_candidate_derived_fields()
returns trigger
language plpgsql
as $$
begin
  new.is_minor := (age(current_date, new.birth_date) < interval '18 years');

  if new.is_minor and (new.guardian_email is null or length(trim(new.guardian_email)) = 0) then
    raise exception 'Bei minderjaehrigen Kandidaturen ist die E-Mail-Adresse der/des Erziehungsberechtigten Pflicht.';
  end if;

  new.status := case when new.is_minor then 'pending_payment' else 'pending_review' end;
  new.guardian_user_id := null;
  new.guardian_confirmed_at := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.resulting_talent_id := null;
  new.stripe_checkout_session_id := null;
  new.paid_at := null;
  new.amount_paid_cents := null;

  return new;
end;
$$;

-- RLS-Sichtbarkeit: 'pending_payment' ebenfalls ausschließen, bis die
-- Zahlung bestätigt ist (gleiches Prinzip wie zuvor bei
-- 'pending_guardian_consent' — unbezahlte/unbestätigte Kandidaturen
-- sind für den Verein nicht sichtbar).
drop policy if exists "talent_candidates_select_same_club" on public.talent_candidates;
create policy "talent_candidates_select_same_club"
on public.talent_candidates
for select
to authenticated
using (
  club_id = public.current_user_club_id()
  and status not in ('pending_guardian_consent', 'pending_payment')
  and (not is_minor or public.current_user_has_youth_access())
);

drop policy if exists "talent_candidates_update_review_same_club" on public.talent_candidates;
create policy "talent_candidates_update_review_same_club"
on public.talent_candidates
for update
to authenticated
using (
  club_id = public.current_user_club_id()
  and status = 'pending_review'
  and (not is_minor or public.current_user_has_youth_access())
)
with check (
  club_id = public.current_user_club_id()
  and status in ('accepted', 'declined')
  and (not is_minor or public.current_user_has_youth_access())
);

-- confirm_candidate_guardian_consent(): jetzt unabhängig vom Status
-- anhand von guardian_user_id is null matchen (statt nur bei Status
-- 'pending_guardian_consent'), damit sie auch für den neuen
-- zahlungsbasierten Ablauf funktioniert — dort wird der Status bereits
-- per Stripe-Webhook auf 'pending_review' gesetzt (siehe
-- app/api/stripe/webhook/route.ts), diese Funktion befüllt danach nur
-- noch guardian_user_id, sobald der Elternteil seine eigene
-- Portal-Einladung abschließt. Der Status wird nur noch verändert, wenn
-- er zufällig noch beim alten Wert 'pending_guardian_consent' steht
-- (alter Ablauf, weiterhin unterstützt für evtl. bereits offene
-- Kandidaturen).
create or replace function public.confirm_candidate_guardian_consent()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  verified_email text;
begin
  select lower(email) into verified_email from auth.users where id = auth.uid();

  if verified_email is null then
    return;
  end if;

  update public.talent_candidates
  set guardian_user_id = auth.uid(),
      guardian_confirmed_at = now(),
      status = case when status = 'pending_guardian_consent' then 'pending_review' else status end
  where lower(guardian_email) = verified_email
    and guardian_user_id is null;
end;
$$;
