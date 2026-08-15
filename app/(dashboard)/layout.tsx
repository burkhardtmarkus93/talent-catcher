import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { ProductTour } from "@/components/tour/ProductTour";
import { getCurrentAppUser } from "@/lib/queries/session";
import { getClubBilling, hasActiveAccess } from "@/lib/queries/billing";
import { INTRO_TOUR_STEPS } from "@/lib/tour/steps";

// Zweite Schutzschicht zusätzlich zur Middleware (Defense-in-Depth,
// siehe technischer Umsetzungsplan): selbst wenn die Middleware aus
// irgendeinem Grund nicht greift, blockiert dieses Layout serverseitig
// jeden Zugriff ohne gültige Session und ohne passendes users-Profil.
//
// Zusätzlich: Trial-Gate. Nach Ablauf der kostenlosen 3-Tage-Testphase
// (clubs.trial_ends_at) ohne aktives Abo wird auf /billing umgeleitet.
// Die Abo-Seite liegt bewusst außerhalb dieser Route-Gruppe (app/billing/,
// eigenes Layout ohne diesen Check), damit sie erreichbar bleibt, um
// einen Plan zu wählen — sonst gäbe es eine Redirect-Schleife.
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const appUser = await getCurrentAppUser();

  if (!appUser) {
    redirect("/login");
  }

  if (appUser.clubId) {
    const billing = await getClubBilling(appUser.clubId);
    if (billing && !hasActiveAccess(billing)) {
      redirect("/billing?reason=trial_expired");
    }
  }

  const tourSteps = INTRO_TOUR_STEPS.filter(
    (step) => !step.adminOnly || appUser.role === "admin"
  );

  return (
    <DashboardShell appUser={appUser}>
      <>
        {children}
        <ProductTour steps={tourSteps} autoStart={!appUser.hasSeenIntroTour} />
      </>
    </DashboardShell>
  );
}
