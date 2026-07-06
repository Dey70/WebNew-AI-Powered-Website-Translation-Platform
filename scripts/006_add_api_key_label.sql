-- V2 Milestone 3: optional user-supplied label to distinguish multiple keys
-- per site (e.g. "Production" vs "Staging"). Nullable -- UI falls back to
-- showing the key prefix when absent.
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS label TEXT;
