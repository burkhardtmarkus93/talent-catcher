import { createBrowserClient } from "@supabase/ssr";

// Für Client Components. Nutzt den anonymen Key — RLS greift serverseitig
// in der Datenbank, dieser Client bekommt nur, wofür der eingeloggte
// Nutzer laut Policy berechtigt ist.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
