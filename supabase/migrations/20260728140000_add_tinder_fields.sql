-- 20260728140000_add_tinder_fields.sql
-- TINDER-Felder für Talente:
-- - TINDER-Skala: 1-4
-- - Potenzial-Skala: 1-4
-- - leistungsbewertung bewusst weggelassen

alter table public.talents
  add column if not exists tinder_skala smallint,
  add column if not exists potenzial_skala smallint;

alter table public.talents
  add constraint talents_tinder_skala_check
    check (tinder_skala is null or tinder_skala between 1 and 4);

alter table public.talents
  add constraint talents_potenzial_skala_check
    check (potenzial_skala is null or potenzial_skala between 1 and 4);
