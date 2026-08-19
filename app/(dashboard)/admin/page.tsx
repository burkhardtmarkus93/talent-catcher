import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { getCurrentAppUser } from "@/lib/queries/session";
import { getClubMembers } from "@/lib/queries/team";
import { getMyProfile } from "@/lib/queries/profile";
import { updateClubName } from "@/lib/actions/club";
import {
  inviteTeamMember,
  updateTeamMemberRole,
  setTeamMemberActive,
} from "@/lib/actions/team";
import { triggerStripeSetup } from "@/lib/actions/adminStripe";
import type { Role } from "@/lib/types";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const appUser = await getCurrentAppUser();

  if (!appUser?.clubId || appUser.role !== "admin") {
    redirect("/dashboard?error=Nur%20f%C3%BCr%20Vereins-Admins.");
  }

  const [members, profile, t] = await Promise.all([
    getClubMembers(),
    getMyProfile(),
    getTranslations("adminPage"),
  ]);

  const roleLabels: Record<Role, string> = {
    scout: t("roleScout"),
    club_admin: t("roleClubAdmin"),
    admin: t("roleAdmin"),
    parent: t("roleParent"),
  };

  return (
    <div>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
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
          {decodeURIComponent(searchParams.success)}
        </div>
      ) : null}

      <section className="animate-fade-in-up mb-8 rounded-xl border border-line bg-surface p-5">
        <h2 className="mb-4 font-display text-lg font-medium text-ink">{t("club")}</h2>
        <form action={updateClubName} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 min-w-[220px] flex-col gap-1.5 text-sm text-ink">
            {t("clubName")}
            <input
              type="text"
              name="name"
              defaultValue={profile?.clubName ?? ""}
              required
              className="field"
            />
          </label>
          <Button type="submit" variant="secondary">
            {t("save")}
          </Button>
        </form>
      </section>

      <section
        className="animate-fade-in-up mb-8 rounded-xl border border-line bg-surface p-5"
        style={{ animationDelay: "80ms" }}
      >
        <h2 className="mb-4 font-display text-lg font-medium text-ink">
          {t("team", { count: members.length })}
        </h2>
        <ul className="flex flex-col gap-3">
          {members.map((m) => {
            const initials = m.email.slice(0, 2).toUpperCase();
            const isSelf = m.id === appUser.id;
            return (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-paper px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-gradient-to-br from-pitch-bright to-pitch text-xs font-semibold text-white shadow-sm">
                    {initials}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {m.fullName || m.email}
                      {isSelf && <span className="ml-1.5 text-xs text-muted">{t("you")}</span>}
                    </p>
                    <p className="text-xs text-muted">{m.email}</p>
                  </div>
                  <span
                    className={`ml-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      m.isActive ? "bg-pitch-dim text-pitch-dark" : "bg-brick-dim text-brick"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                    {m.isActive ? t("active") : t("deactivated")}
                  </span>
                </div>

                {isSelf ? (
                  <span className="text-xs text-muted">
                    {roleLabels[m.role]}
                    {m.hasYouthAccess && ` · ${t("youthAccess")}`}
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <form
                      action={updateTeamMemberRole}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="hidden" name="userId" value={m.id} />
                      <select
                        name="role"
                        defaultValue={m.role === "admin" ? "admin" : "scout"}
                        className="select-field w-auto py-1"
                      >
                        <option value="scout">{t("roleScout")}</option>
                        <option value="admin">{t("roleAdmin")}</option>
                      </select>
                      <label className="flex items-center gap-1.5 text-xs text-muted">
                        <input
                          type="checkbox"
                          name="hasYouthAccess"
                          defaultChecked={m.hasYouthAccess}
                        />
                        {t("youthAccess")}
                      </label>
                      <Button type="submit" variant="secondary">
                        {t("save")}
                      </Button>
                    </form>
                    <form action={setTeamMemberActive}>
                      <input type="hidden" name="userId" value={m.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={m.isActive ? "false" : "true"}
                      />
                      <Button type="submit" variant="ghost">
                        {m.isActive ? t("deactivate") : t("reactivate")}
                      </Button>
                    </form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section
        className="animate-fade-in-up rounded-xl border border-line bg-surface p-5"
        style={{ animationDelay: "140ms" }}
      >
        <h2 className="mb-1 font-display text-lg font-medium text-ink">
          {t("inviteMember")}
        </h2>
        <p className="mb-4 text-xs text-muted">
          {t("inviteMemberHint")}
        </p>
        <form action={inviteTeamMember} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-1 min-w-[220px] flex-col gap-1.5 text-sm text-ink">
            {t("email")}
            <input
              type="email"
              name="email"
              required
              placeholder="scout@verein.de"
              className="field"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm text-ink">
            {t("role")}
            <select name="role" defaultValue="scout" className="select-field">
              <option value="scout">{t("roleScout")}</option>
              <option value="admin">{t("roleAdmin")}</option>
            </select>
          </label>
          <Button type="submit">{t("invite")}</Button>
        </form>
      </section>

      <section
        className="animate-fade-in-up mt-8 rounded-xl border border-line bg-surface p-5"
        style={{ animationDelay: "200ms" }}
      >
        <h2 className="mb-1 font-display text-lg font-medium text-ink">
          {t("billingSetup")}
        </h2>
        <p className="mb-4 text-xs text-muted">
          {t("billingSetupHint")}
        </p>
        <form action={triggerStripeSetup}>
          <Button type="submit" variant="secondary">
            {t("runBillingSetup")}
          </Button>
        </form>
      </section>
    </div>
  );
}
