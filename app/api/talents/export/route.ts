import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getTalents, type TalentFilters } from "@/lib/queries/talents";
import { getCurrentAppUser } from "@/lib/queries/session";

// Läuft über den normalen, session-gebundenen Supabase-Client
// (getTalents()/getCurrentAppUser()) — keine eigene Datenzugriffslogik,
// RLS greift also identisch zur Talentliste im Browser.
//
// WICHTIG (Jugendschutz, siehe CLAUDE.md Kapitel 3): Die Talentliste
// maskiert Verein/Team und Ampel-Status für Minderjährige, wenn die
// aufrufende Person keine hasYouthAccess-Berechtigung hat (siehe
// TalentTable.tsx, `isMasked`). Diese Maskierung ist bislang reine
// Anzeigelogik in der React-Komponente — getTalents() selbst liefert
// die vollen Felder unabhängig davon. Ein Export, der getTalents()
// direkt in CSV umwandelt, würde diese Sperre umgehen. Die exakt
// gleiche Maskierungsregel wird deshalb hier ein zweites Mal angewendet,
// nicht wiederverwendet (keine gemeinsame Hilfsfunktion vorhanden,
// siehe TalentTable.tsx) — bewusst dieselbe Bedingung, um keine neue,
// abweichende Regel zu erfinden.
function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function age(birthDate: string): number {
  const diff = Date.now() - new Date(birthDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

export async function GET(request: NextRequest) {
  const appUser = await getCurrentAppUser();
  if (!appUser) {
    return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const filters: TalentFilters = {
    q: sp.get("q") ?? "",
    showArchived: sp.get("showArchived") === "1",
    position: sp.get("position") ?? "alle",
    status: sp.get("status") ?? "alle",
    alert: sp.get("alert") ?? "alle",
    hiddenGem: sp.get("hiddenGem") ?? "alle",
    dfbStuetzpunkt: sp.get("dfbStuetzpunkt") ?? "alle",
    verbandsauswahl: sp.get("verbandsauswahl") ?? "alle",
    nationalmannschaft: sp.get("nationalmannschaft") ?? "alle",
    nlz: sp.get("nlz") ?? "alle",
    euPassport: sp.get("euPassport") ?? "alle",
  };

  const [talents, tTable, tRisk] = await Promise.all([
    getTalents(filters),
    getTranslations("talentTable"),
    getTranslations("riskDot"),
  ]);

  const statusLabels: Partial<Record<string, string>> = {
    in_beobachtung: tTable("statusInBeobachtung"),
    empfehlung: tTable("statusEmpfehlung"),
    abgeschlossen: tTable("statusAbgeschlossen"),
    verloren: tTable("statusVerloren"),
  };

  const header = [
    tTable("name"),
    tTable("position"),
    tTable("age"),
    tTable("club"),
    tTable("status"),
    tTable("alert"),
    tTable("lastReport"),
  ];

  const rows = talents.map((talent) => {
    const isMasked = talent.isMinor && !appUser.hasYouthAccess;

    const club = isMasked
      ? tTable("clubHidden")
      : [talent.clubNameText, talent.teamNameText].filter(Boolean).join(" · ");

    const alertLabel = isMasked
      ? tTable("restricted")
      : talent.currentAlert
        ? tRisk(talent.currentAlert.riskLevel)
        : "—";

    const lastReport = talent.lastReportDate
      ? new Date(talent.lastReportDate).toISOString().slice(0, 10)
      : "—";

    return [
      `${talent.firstName} ${talent.lastName}`,
      talent.primaryPosition,
      String(age(talent.birthDate)),
      club,
      statusLabels[talent.status] ?? "—",
      alertLabel,
      lastReport,
    ];
  });

  const csvLines = [header, ...rows].map((line) => line.map(csvEscape).join(","));
  // BOM, damit Excel UTF-8 (Umlaute etc.) korrekt erkennt statt zu raten.
  const csv = "﻿" + csvLines.join("\r\n") + "\r\n";

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="talente.csv"',
    },
  });
}
