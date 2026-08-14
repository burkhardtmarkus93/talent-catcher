import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getCurrentAppUser } from "@/lib/queries/session";
import { getClubBilling } from "@/lib/queries/billing";
import { PLANS, formatEuro } from "@/lib/plans";
import { createCheckoutSession, createBillingPortalSession } from "@/lib/actions/billing";

const statusLabels: Record<string, string> = {
  active: "Aktiv",
  trialing: "Testphase",
  past_due: "Zahlung überfällig",
  canceled: "Gekündigt",
  incomplete: "Zahlung ausstehend",
  incomplete_expired: "Zahlung fehlgeschlagen",
  unpaid: "Unbezahlt",
  paused: "Pausiert",
};

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string; canceled?: string };
}) {
  const appUser = await getCurrentAppUser();
  const billing = appUser?.clubId ? await getClubBilling(appUser.clubId) : null;
  const currentPlan = billing ? PLANS[billing.plan] : null;
  const isAdmin = appUser?.role === "admin";

  return (
    <div>
      <PageHeader title="Abo" subtitle="Plan und Zahlungsdaten deines Vereins" />

      {searchParams.error ? (
        <div className="mb-6 rounded-lg border border-brick/30 bg-brick/5 px-3 py-2 text-sm text-brick">
          {decodeURIComponent(searchParams.error)}
        </div>
      ) : null}
      {searchParams.success ? (
        <div className="mb-6 rounded-lg border border-pitch/30 bg-pitch/5 px-3 py-2 text-sm text-pitch">
          Zahlung erfolgreich — dein Abo wird in Kürze aktiv (kann bis zu einer Minute dauern).
        </div>
      ) : null}
      {searchParams.canceled ? (
        <div className="mb-6 rounded-lg border border-line bg-paper px-3 py-2 text-sm text-muted">
          Checkout abgebrochen — es wurde nichts abgebucht.
        </div>
      ) : null}

      <div className="mb-8 rounded-xl border border-line bg-surface p-6">
        <p className="text-xs uppercase tracking-wide text-muted">Aktueller Plan</p>
        <p className="mt-1 font-display text-2xl font-medium text-ink">
          {currentPlan?.name ?? "—"}
        </p>
        {billing?.subscriptionStatus && (
          <p className="mt-1 text-sm text-muted">
            Status: {statusLabels[billing.subscriptionStatus] ?? billing.subscriptionStatus}
          </p>
        )}
        {!billing?.hasStripeCustomer && (
          <p className="mt-1 text-sm text-muted">
            Noch kein aktives, bezahltes Abo — wähle unten einen Plan.
          </p>
        )}

        {isAdmin && billing?.hasStripeCustomer && (
          <form action={createBillingPortalSession} className="mt-4">
            <Button variant="secondary" type="submit">
              Zahlungsmethode &amp; Rechnungen verwalten
            </Button>
          </form>
        )}
      </div>

      {isAdmin && (
        <section>
          <h2 className="mb-4 font-display text-lg font-medium text-ink">Plan wechseln</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["start", "verein"] as const).map((key) => {
              const plan = PLANS[key];
              return (
                <div
                  key={key}
                  className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5"
                >
                  <div>
                    <p className="font-display text-lg font-medium text-ink">{plan.name}</p>
                    <p className="text-xs text-muted">{plan.tagline}</p>
                  </div>
                  <ul className="flex flex-col gap-1 text-xs text-muted">
                    {plan.features.map((f) => (
                      <li key={f}>· {f}</li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-center gap-2">
                    <form action={createCheckoutSession}>
                      <input type="hidden" name="plan" value={key} />
                      <input type="hidden" name="billingInterval" value="monatlich" />
                      <Button variant="secondary" type="submit">
                        {formatEuro(plan.priceMonthly!)}/Monat wählen
                      </Button>
                    </form>
                    <form action={createCheckoutSession}>
                      <input type="hidden" name="plan" value={key} />
                      <input type="hidden" name="billingInterval" value="jaehrlich" />
                      <Button type="submit">
                        {formatEuro(plan.priceYearly!)}/Jahr wählen
                      </Button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
