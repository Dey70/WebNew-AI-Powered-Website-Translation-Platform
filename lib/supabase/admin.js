import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for use inside pages/api/* only.
 * Bypasses RLS by design — every query using this client MUST filter by site_id
 * in application code (RLS on tenant tables is enabled with zero policies as a
 * default-deny backstop, not the primary tenant boundary).
 */
export function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
