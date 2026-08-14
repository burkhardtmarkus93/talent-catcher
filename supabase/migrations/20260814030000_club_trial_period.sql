-- Kostenlose 3-Tage-Testphase pro Verein (Selbstregistrierung).
--
-- RLS-Überlegung: trial_ends_at liegt auf public.clubs, bereits durch
-- clubs_select_own_club / clubs_update_admin_only (aus
-- 20260722213000_rls_extended.sql) auf den eigenen Verein beschränkt.
-- Wie plan/billing_interval/Stripe-Felder (siehe
-- 20260814020000_stripe_billing_fields.sql) darf ein eingeloggter Nutzer
-- diese Spalte nie direkt selbst setzen — sonst könnte sich ein Admin die
-- eigene Testphase per direktem Update beliebig verlängern. Daher in
-- denselben Guard-Trigger aufgenommen statt einer neuen Policy.
--
-- Zugriffslogik (siehe lib/queries/billing.ts::hasActiveAccess): Zugriff
-- besteht, solange entweder ein aktives/testendes Stripe-Abo vorliegt ODER
-- trial_ends_at noch in der Zukunft liegt. Durchgesetzt in
-- app/(dashboard)/layout.tsx. Die Abo-Seite selbst liegt bewusst außerhalb
-- dieser Gruppe (app/billing/, eigenes Layout ohne den Trial-Gate-Check),
-- damit sie nach Ablauf der Testphase weiterhin erreichbar bleibt, um
-- einen Plan zu wählen.

alter table public.clubs
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '3 days');

create or replace function public.guard_clubs_billing_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and (
       new.plan is distinct from old.plan
       or new.billing_interval is distinct from old.billing_interval
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.subscription_status is distinct from old.subscription_status
       or new.trial_ends_at is distinct from old.trial_ends_at
     ) then
    raise exception 'Plan und Abrechnungsdaten können nicht direkt geändert werden.';
  end if;

  return new;
end;
$$;

-- Der Trigger trg_guard_clubs_billing_fields existiert bereits (siehe
-- 20260814020000_stripe_billing_fields.sql) und zeigt per Namen auf diese
-- Funktion — durch create or replace übernimmt er die neue Prüfung
-- automatisch, ein erneutes create trigger ist nicht nötig.
