export async function getTalents(): Promise<Talent[]> {
  const supabase = await createClient();

  const { data, error } = await supabase.from("talents").select();

  console.log("getTalents debug:", {
    dataLength: Array.isArray(data) ? data.length : null,
    error,
  });

  if (error) {
    console.error("getTalents() fehlgeschlagen:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new Error("Talente konnten nicht geladen werden.");
  }

  return [];
}
