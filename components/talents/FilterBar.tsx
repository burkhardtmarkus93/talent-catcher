// Bewusst als einfache, unkontrollierte Selects gebaut: im Ausbauschritt
// steuern diese die `searchParams` der Server-Component-Route (siehe
// technischer Umsetzungsplan, Abschnitt 5), sodass Filter teilbar/
// bookmarkbar bleiben statt in Client-State zu leben.
export function FilterBar() {
  return (
    <div className="mb-4 flex flex-wrap gap-3 rounded-sm border border-line bg-surface px-4 py-3">
      <Select label="Position" options={["Alle", "TW", "IV", "DM", "ST", "RM"]} />
      <Select label="Status" options={["Alle", "In Beobachtung", "Empfehlung", "Abgeschlossen", "Verloren"]} />
      <Select label="Ampel" options={["Alle", "Rot", "Gelb", "Grün"]} />
      <Select label="Hidden Gem" options={["Alle", "Nur Hidden Gems"]} />
    </div>
  );
}

function Select({ label, options }: { label: string; options: string[] }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      {label}
      <select className="rounded-sm border border-line bg-white px-2 py-1 text-ink">
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}
