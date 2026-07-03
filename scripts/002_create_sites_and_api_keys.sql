-- Multi-tenancy foundation: one row per registered website, one or more API keys per site.
-- Tenant boundary is enforced in application code (service-role client + site_id filtering),
-- NOT by RLS -- there is no Supabase Auth session/JWT carrying a site_id claim in this phase.
-- RLS is enabled with zero policies below as a default-deny backstop against anon-key leakage.

CREATE TABLE IF NOT EXISTS public.sites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  owner_email      TEXT NOT NULL,
  allowed_origins  TEXT[] NOT NULL DEFAULT '{}', -- normalized hostnames only, e.g. {'example.com','www.example.com'}
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id        UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  key_prefix     TEXT NOT NULL UNIQUE, -- first ~12 chars of the raw key, e.g. "wn_live_a1B2"; safe to display truncated
  key_hash       TEXT NOT NULL,        -- sha256(rawKey + API_KEY_PEPPER), hex; the raw key itself is never stored
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at   TIMESTAMPTZ,
  revoked_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_api_keys_site_id ON public.api_keys(site_id);

ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
-- Deliberately no policies for anon/authenticated roles: RLS enabled + zero policies = default deny.
-- The service_role client (used only inside pages/api/*.js) bypasses RLS entirely and is the
-- sole reader/writer of these tables.
