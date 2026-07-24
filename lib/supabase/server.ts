import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

// Für Server Components / Server Actions. Liest die Session aus den
// Cookies, damit RLS-Policies mit dem eingeloggten Nutzer arbeiten.
//
// Hinweis (Fix gegenüber der ersten Version): @supabase/ssr erwartet seit
// einiger Zeit das getAll()/setAll()-Cookie-Interface, nicht mehr
// get()/set()/remove(). Die alte Signatur führte zu einem Laufzeitfehler
// bei jedem Zugriff auf die Session. `cookies()` wird zusätzlich awaited,
// da neuere Next.js-Versionen das verlangen — schadet bei 14.2 nicht.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Aufruf aus einer Server Component heraus — kann ignoriert
            // werden, solange die Middleware die Session aktuell hält.
          }
        },
      },
    }
  );
}

// Ausschließlich für serverseitige Admin-Operationen (z. B. Import-Verarbeitung).
// NIEMALS in Client Components importieren — der Service-Role-Key
// umgeht sämtliche RLS-Policies.
export function createAdminClient() {
  const { createClient: createSupabaseClient } = require("@supabase/supabase-js");
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
