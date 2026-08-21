-- Einfaches, Postgres-gestütztes Rate-Limiting für öffentliche,
-- unauthentifizierte Formulare (Spieler-Registrierung, Vereins-
-- Empfehlung) — bewusst ohne zusätzlichen externen Dienst (z. B.
-- Redis), da der aktuelle Maßstab das nicht rechtfertigt und das
-- Projekt keine neue Infrastruktur-Abhängigkeit ohne Not bekommen soll.
--
-- Fester Zeitfenster-Zähler (kein Sliding Window) — für Anti-Spam/
-- Kostenschutz ausreichend genau, nicht für sicherheitskritisches
-- Brute-Force-Timing gedacht. Login-Versuche sind bewusst NICHT Teil
-- davon: Supabase Auth bringt dafür bereits eigenes Rate-Limiting mit.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count integer not null default 1
);

alter table public.rate_limits enable row level security;
-- Bewusst keine Policies: Zugriff ausschließlich über die untenstehende
-- SECURITY DEFINER-Funktion, nie direkt über die Tabelle (weder lesend
-- noch schreibend) — gleiches Prinzip wie bei anderen internen
-- Zähler-/Steuerungstabellen in diesem Projekt.

create or replace function public.check_rate_limit(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count integer;
begin
  insert into public.rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set
      window_start = case
        when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then now()
        else public.rate_limits.window_start
      end,
      count = case
        when public.rate_limits.window_start < now() - make_interval(secs => p_window_seconds)
          then 1
        else public.rate_limits.count + 1
      end
  returning count into current_count;

  return current_count <= p_max_attempts;
end;
$$;

grant execute on function public.check_rate_limit(text, integer, integer) to anon, authenticated;
