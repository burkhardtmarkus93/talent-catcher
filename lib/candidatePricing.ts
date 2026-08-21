// Einmalige Gebühr für die Registrierung eines minderjährigen Spielers
// durch eine/n Erziehungsberechtigte/n (siehe lib/actions/candidates.ts::
// submitTalentCandidate). Einzige Quelle der Wahrheit für den Preis,
// analog zu PLANS in lib/plans.ts für die Vereins-Pläne.
//
// Preis-Vorschlag (mit dem Projektverantwortlichen abgestimmt): 9,90 €
// als moderate, einmalige Bearbeitungsgebühr — bewusst niedrig gehalten,
// um nicht wie ein "Pay-to-be-scouted"-Modell zu wirken (siehe CLAUDE.md
// Kapitel 5/8). Endgültiger Preis und Vertragstext/AGB/Widerrufsrecht
// sollten vor Live-Schaltung juristisch geprüft werden.
export const CANDIDATE_REGISTRATION_PRICE_EUR = 9.9;
export const CANDIDATE_REGISTRATION_LOOKUP_KEY = "candidate_registration_onetime";
