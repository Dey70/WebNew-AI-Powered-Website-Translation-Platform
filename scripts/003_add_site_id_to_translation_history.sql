-- translation_history currently holds only public demo data (see 001's own comment:
-- "demo app without user auth"). Adding a required site_id column means existing rows
-- must go -- there is no real customer data to preserve at this point.
TRUNCATE public.translation_history;

ALTER TABLE public.translation_history
  ADD COLUMN site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_translation_history_site_id ON public.translation_history(site_id);

-- Replace the fully-public policies from 001 with the same default-deny posture as
-- sites/api_keys: RLS stays enabled, but with zero policies. Tenant scoping is enforced
-- in application code via the service-role client + site_id filtering.
DROP POLICY IF EXISTS "Allow public read access"   ON public.translation_history;
DROP POLICY IF EXISTS "Allow public insert access" ON public.translation_history;
DROP POLICY IF EXISTS "Allow public delete access"  ON public.translation_history;
