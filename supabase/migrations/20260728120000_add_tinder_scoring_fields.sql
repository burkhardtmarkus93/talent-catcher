-- Additive Migration: TINDER-Kriterien (DFB-Talentförderprogramm) als
-- ergänzende Felder zu scout_reports.
--
-- Bewusste Entscheidung (Option A): Diese Felder sind unabhängig vom
-- bestehenden overall_rating-Trigger (score_technik/taktik/athletik/
-- mentalitaet). Sie beeinflussen die automatische Berechnung NICHT,
-- sondern liefern zusätzlichen Kontext für die Risk-Engine (z.B.
-- RAE-/Reifegrad-Warnungen, Hidden-Gem-Erkennung bei hohem Potenzial
-- trotz durchschnittlicher Bewertung).
--
-- RLS: keine zusätzliche Policy nötig, da RLS auf scout_reports
-- zeilenbasiert wirkt (siehe rls_extended.sql, scout_reports_select_
-- same_club / scout_reports_insert_same_club / scout_reports_update_
-- author_or_admin) und diese neuen Spalten automatisch mit abdeckt.

alter table public.scout_reports
  add column tinder_trainingssensitivitaet smallint
    check (tinder_trainingssensitivitaet between 1 and 4),
  add column tinder_intelligenz smallint
    check (tinder_intelligenz between 1 and 4),
  add column tinder_naturell smallint
    check (tinder_naturell between 1 and 4),
  add column tinder_dynamik smallint
    check (tinder_dynamik between 1 and 4),
  add column tinder_erfolgsmotivation smallint
    check (tinder_erfolgsmotivation between 1 and 4),
  add column tinder_resilienz smallint
    check (tinder_resilienz between 1 and 4),
  add column potenzial smallint
    check (potenzial between 1 and 4),
  add column reifegrad smallint
    check (reifegrad between -2 and 2);

comment on column public.scout_reports.tinder_trainingssensitivitaet is
  'DFB TINDER-Modell: Trainingssensitivitaet, Skala 1 (schwach) bis 4 (aussergewoehnlich). Unabhaengig von overall_rating.';
comment on column public.scout_reports.tinder_intelligenz is
  'DFB TINDER-Modell: Intelligenz im Spiel, Skala 1-4. Unabhaengig von overall_rating.';
comment on column public.scout_reports.tinder_naturell is
  'DFB TINDER-Modell: Naturell, Skala 1-4. Unabhaengig von overall_rating.';
comment on column public.scout_reports.tinder_dynamik is
  'DFB TINDER-Modell: Dynamik, Skala 1-4. Unabhaengig von overall_rating.';
comment on column public.scout_reports.tinder_erfolgsmotivation is
  'DFB TINDER-Modell: Erfolgsmotivation, Skala 1-4. Unabhaengig von overall_rating.';
comment on column public.scout_reports.tinder_resilienz is
  'DFB TINDER-Modell: Resilienz, Skala 1-4. Unabhaengig von overall_rating.';
comment on column public.scout_reports.potenzial is
  'DFB-Bewertungssystem: Potenzial 1 (hoch) bis 4 (unterdurchschnittlich). Separat von overall_rating (Leistung heute vs. Potenzial).';
comment on column public.scout_reports.reifegrad is
  'Biologischer Reifegrad relativ zum kalendarischen Alter, -2 (Spaetentwickler) bis +2 (frueh entwickelt). Dient RAE-/Reifegrad-Warnungen in der Risk-Engine.';
