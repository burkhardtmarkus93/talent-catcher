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

const statusTone: Record<string, string> = {
  active: "bg-pitch-dim text-pitch-dark",
  trialing: "bg-pitch-dim text-pitch-dark",
  past_due: "bg-amber-dim text-amber-dark",
  incomplete: "bg-amber-dim text-amber-dark",
  paused: "bg-amber-dim text-amber-dark",
  canceled: "bg-brick-dim text-brick",
  incomplete_expired: "bg-brick-dim text-brick",
  unpaid: "bg-brick-dim text-brick",
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
      <PageHeader
        title="Abo"
        subtitle="Plan und Zahlungsdaten deines Vereins"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
          </svg>
        }
      />

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

      <div className="animate-fade-in-up relative mb-8 overflow-hidden rounded-xl border border-line bg-surface p-6">
        <div
          className="pointer-events-none absolute -right-16 -top-24 h-56 w-56 rounded-full bg-gradient-to-br from-pitch-bright/25 to-pitch/0 blur-2xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gradient-to-br from-pitch-bright to-pitch text-white shadow-sm">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Aktueller Plan</p>
              <p className="mt-1 font-display text-2xl font-medium text-ink">
                {currentPlan?.name ?? "—"}
              </p>
              {billing?.subscriptionStatus && (
                <span
                  className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    statusTone[billing.subscriptionStatus] ?? "bg-paper text-muted"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                  {statusLabels[billing.subscriptionStatus] ?? billing.subscriptionStatus}
                </span>
              )}
              {!billing?.hasStripeCustomer && (
                <p className="mt-2 text-sm text-muted">
                  Noch kein aktives, bezahltes Abo — wähle unten einen Plan.
                </p>
              )}
            </div>
          </div>

          {isAdmin && billing?.hasStripeCustomer && (
            <form action={createBillingPortalSession}>
              <Button variant="secondary" type="submit">
                Zahlungsmethode &amp; Rechnungen verwalten
              </Button>
            </form>
          )}
        </div>
      </div>

      {isAdmin && (
        <section
          className="animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          <h2 className="mb-4 font-display text-lg font-medium text-ink">Plan wechseln</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {(["start", "verein"] as const).map((key, i) => {
              const plan = PLANS[key];
              const isCurrent = billing?.plan === key && billing?.hasStripeCustomer;
              return (
                <div
                  key={key}
                  className={`animate-fade-in-up relative flex flex-col gap-3 rounded-xl border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isCurrent ? "border-pitch ring-1 ring-pitch/30" : "border-line"
                  }`}
                  style={{ animationDelay: `${140 + i * 60}ms` }}
                >
                  {isCurrent && (
                    <span className="absolute -top-2.5 left-5 inline-flex items-center rounded-full bg-pitch px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                      Aktueller Plan
                    </span>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-pitch-dim text-pitch-dark">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        {key === "start" ? (
                          <path d="m12 2 3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7Z" />
                        ) : (
                          <>
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </>
                        )}
                      </svg>
                    </span>
                    <div>
                      <p className="font-display text-lg font-medium text-ink">{plan.name}</p>
                      <p className="text-xs text-muted">{plan.tagline}</p>
                    </div>
                  </div>
                  <ul className="flex flex-col gap-1.5 text-xs text-muted">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="flex-none text-pitch" aria-hidden>
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        {f}
                      </li>
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
