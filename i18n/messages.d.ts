import type messages from "@/messages/de.json";
import type { Locale } from "./config";

// Typisierte Message-Keys: next-intl prüft dann bei useTranslations()/
// getTranslations() die Namespace-/Key-Pfade gegen die tatsächliche
// Struktur von messages/de.json (als Referenz-Sprache) — Tippfehler
// oder fehlende Keys fallen so beim tsc/Build auf, nicht erst zur
// Laufzeit als "MISSING_MESSAGE". de.json muss dafür immer als Erstes
// aktualisiert werden, bevor die anderen Sprachen nachziehen.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
