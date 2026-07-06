import { createClient } from "@/lib/supabase/server";

// Reads the Supabase session cookie (via the SSR client) for App Router
// Route Handlers -- the dashboard's equivalent of resolveSiteFromRequest,
// but resolving a logged-in user instead of an API-key-authenticated site.
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
