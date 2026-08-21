-- Erweitert die einmalige Registrierungsgebühr (siehe Migration
-- 20260821120000) von "nur Erziehungsberechtigte bei minderjährigen
-- Kandidaturen" auf ALLE Kandidaturen, auch volljährige
-- Selbstregistrierungen (mit dem Projektverantwortlichen abgestimmt).
-- Gleicher Preis, gleicher Stripe-Checkout-Mechanismus
-- (lib/candidatePricing.ts) für beide Fälle — keine neue Preislogik
-- nötig, nur die Statuserzwingung im Trigger.

create or replace function public.set_candidate_derived_fields()
returns trigger
language plpgsql
as $$
begin
  new.is_minor := (age(current_date, new.birth_date) < interval '18 years');

  if new.is_minor and (new.guardian_email is null or length(trim(new.guardian_email)) = 0) then
    raise exception 'Bei minderjaehrigen Kandidaturen ist die E-Mail-Adresse der/des Erziehungsberechtigten Pflicht.';
  end if;

  -- Jede Kandidatur (volljährig oder minderjährig) startet jetzt im
  -- Zahlungsstatus, unabhängig vom Alter — siehe Migrationskommentar.
  new.status := 'pending_payment';
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
