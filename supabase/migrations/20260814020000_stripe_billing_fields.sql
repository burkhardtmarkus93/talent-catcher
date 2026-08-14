-- Stripe-Abrechnungsfelder auf clubs.
--
-- RLS-Überlegung: Die neuen Spalten liegen auf public.clubs, das bereits
-- über clubs_select_own_club / clubs_update_admin_only (aus
-- 20260722213000_rls_extended.sql) auf den eigenen Verein beschränkt ist.
-- Geschrieben werden diese Felder ausschließlich vom Stripe-Webhook-Handler
-- über den Service-Role-Client (createAdminClient(), umgeht RLS bewusst,
-- da der Webhook keinen eingeloggten Nutzer hat).
--
-- Beim Einbauen ist aufgefallen, dass "clubs_update_admin_only" (wie schon
-- bei "users_update_own" in der vorherigen Migration) keine Spalten
-- einschränkt: ein Club-Admin könnte über einen direkten Update-Call auf
-- die eigene Vereinszeile plan/billing_interval frei setzen — also sich
-- selbst ein bezahltes Abo "freischalten", ohne je bei Stripe zu bezahlen.
-- Wird hier zusätzlich per Guard-Trigger geschlossen (gleiches Muster wie
-- guard_users_self_update()).

alter table public.clubs
  add column if not exists stripe_customer_id text unique,
  add column if not exists stripe_subscription_id text unique,
  add column if not exists subscription_status text;

create index if not exists idx_clubs_stripe_customer on public.clubs(stripe_customer_id);
create index if not exists idx_clubs_stripe_subscription on public.clubs(stripe_subscription_id);

create or replace function public.guard_clubs_billing_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() ist null, wenn der Service-Role-Client schreibt (Webhook) —
  -- nur dann dürfen sich diese Felder ändern. Ein eingeloggter Nutzer
  -- (auth.uid() gesetzt) darf plan/billing_interval/Stripe-Referenzen nie
  -- direkt selbst ändern, nur über den bezahlten Checkout-Flow.
  if auth.uid() is not null
     and (
       new.plan is distinct from old.plan
       or new.billing_interval is distinct from old.billing_interval
       or new.stripe_customer_id is distinct from old.stripe_customer_id
       or new.stripe_subscription_id is distinct from old.stripe_subscription_id
       or new.subscription_status is distinct from old.subscription_status
     ) then
    raise exception 'Plan und Abrechnungsdaten können nicht direkt geändert werden.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_clubs_billing_fields on public.clubs;

create trigger trg_guard_clubs_billing_fields
before update on public.clubs
for each row
execute function public.guard_clubs_billing_fields();
