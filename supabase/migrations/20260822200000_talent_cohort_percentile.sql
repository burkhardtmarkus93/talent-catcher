-- Grober, seltener aktualisierter Vergleichswert eines Talents gegenüber
-- anderen Talenten DERSELBEN Position und DESSELBEN Jahrgangs, plattform-
-- weit über alle Vereine hinweg — auf ausdrücklichen Wunsch des
-- Projektverantwortlichen, um dem Effekt entgegenzuwirken, dass ein
-- Verein sein bestes Talent für überdurchschnittlich hält, obwohl es im
-- Vergleich zu Talenten anderer Vereine nur Mittelmaß ist.
--
-- Bewusst KEIN Ranking mit Platzierung oder Score, sondern nur ein grobes
-- Quartil ("oberes Viertel" / "obere Mitte" / "untere Mitte" / "unteres
-- Viertel") -- und bewusst KEINE Möglichkeit, andere Vereine oder deren
-- Talente einzusehen. Das entspricht demselben Datensparsamkeits-Prinzip
-- wie talent_exists_at_club() (Migration 20260821140000): plattformweite
-- Aggregation ja, individuelle Cross-Vereins-Auskunft nein.
--
-- "Unter Berücksichtigung der Entwicklung" (siehe Rückfrage): es wird
-- NICHT die rohe Durchschnittsnote (overall_rating) verglichen, sondern
-- derselbe "value_score" = avgRating × Werthaltigkeits-Multiplikator, den
-- die Risk-Engine (lib/alerts/riskEngine.ts) für jedes Talent ohnehin
-- schon berechnet -- der Multiplikator selbst berücksichtigt bereits
-- Reifegrad/Spätentwickler-Signal, Potenzial, Aufwärtstrend, TINDER-Werte
-- und (bei Torhütern) den Koordinationstest. Das ist bewusste
-- Wiederverwendung statt einer zweiten, parallelen Gewichtungslogik --
-- bedeutet aber auch: "Entwicklungsbereinigt" heißt hier konkret "nach
-- demselben Maßstab wie der Rest der Risk-Engine", nicht eine isolierte
-- Alters-/Reifegrad-Korrektur für sich allein.
--
-- Mindestgruppengröße von 30 Talenten je Position+Jahrgang, bevor
-- überhaupt ein Quartil angezeigt wird -- verhindert Rückschlüsse auf
-- einzelne andere Talente bei kleinen Vergleichsgruppen (gerade zu
-- Beginn, wenn erst wenige Vereine auf der Plattform sind). Schwellenwert
-- ist eine Ersteinschätzung, keine abgestimmte Geschäftsentscheidung.

alter table public.alerts
  add column if not exists value_score numeric(4,2);

alter table public.talents
  add column if not exists cohort_percentile_bucket varchar(20)
    check (cohort_percentile_bucket in ('top25', 'upper_mid', 'lower_mid', 'bottom25')),
  add column if not exists cohort_percentile_updated_at timestamptz;
