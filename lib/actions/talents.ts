export async function archiveTalent(formData: FormData): Promise<void> {
  const talentId = String(formData.get("talentId") ?? "");

  if (!talentId) {
    throw new Error("Talent-ID fehlt.");
  }

  const appUser = await getCurrentAppUser();

  if (!appUser) {
    throw new Error("Benutzerprofil nicht gefunden. Bitte erneut anmelden.");
  }

  if (!appUser.clubId) {
    throw new Error("Deinem Benutzer ist kein Verein zugeordnet.");
  }

  const supabase = await createClient();

  const { data: talent, error: talentError } = await supabase
    .from("talents")
    .select("id, club_id")
    .eq("id", talentId)
    .maybeSingle();

  if (talentError) {
    console.error("archiveTalent(): Talent-Lookup fehlgeschlagen:", {
      message: talentError.message,
      code: talentError.code,
      details: talentError.details,
      hint: talentError.hint,
    });
    throw new Error("Talent konnte nicht geladen werden.");
  }

  if (!talent) {
    throw new Error("Talent nicht gefunden.");
  }

  if (talent.club_id !== appUser.clubId) {
    throw new Error("Du darfst dieses Talent nicht archivieren.");
  }

  const archivedAt = new Date().toISOString();

  const { error } = await supabase
    .from("talents")
    .update({
      archived_at: archivedAt,
    })
    .eq("id", talentId);

  if (error) {
    console.error("archiveTalent() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Talent konnte nicht archiviert werden.");
  }

  const { data: verify, error: verifyError } = await supabase
    .from("talents")
    .select("id, archived_at")
    .eq("id", talentId)
    .maybeSingle();

  if (verifyError) {
    console.error("archiveTalent(): Verifikation fehlgeschlagen:", {
      message: verifyError.message,
      code: verifyError.code,
      details: verifyError.details,
      hint: verifyError.hint,
    });
    throw new Error("Archivierung konnte nicht verifiziert werden.");
  }

  if (!verify || !verify.archived_at) {
    throw new Error("Talent wurde nicht archiviert.");
  }

  revalidatePath("/talents");
  revalidatePath(`/talents/${talentId}`);
  redirect("/talents");
}
