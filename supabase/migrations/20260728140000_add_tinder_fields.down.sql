alter table public.talents
  drop constraint if exists talents_tinder_skala_check;

alter table public.talents
  drop constraint if exists talents_potenzial_skala_check;

alter table public.talents
  drop column if exists tinder_skala;

alter table public.talents
  drop column if exists potenzial_skala;
