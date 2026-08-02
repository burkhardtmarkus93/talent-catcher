import Link from "next/link";
import { archiveTalent } from "@/lib/actions/talents";

export function InactivityBanner({
  talentId,
  lastActivityAt,
}: {
  talentId: string;
  lastActivityAt: Date;
}) {
  const formattedDate = lastActivityAt.toLocaleDateString("de-DE");

  return (
    <div className="mb-4 rounded-sm border border-amber-500/40 bg-amber-50 px-4 py-3">
      <p className="text-sm text-amber-800">
        Seit über 3 Monaten keine Aktivität bei diesem Talent (zuletzt:{" "}
        {formattedDate}).
      </p>
      <div className="mt-2 flex gap-2">
        <form action={archiveTalent}>
          <input type="hidden" name="talentId" value={talentId} />
          <button
            type="submit"
            className="rounded-sm border border-amber-600 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
          >
            Archivieren
          </button>
        </form>
        <Link
          href={`#reminder-form`}
          className="rounded-sm border border-line bg-white px-3 py-1.5 text-sm text-ink hover:bg-paper"
        >
          Nochmal nachhaken →
        </Link>
      </div>
    </div>
  );
}
