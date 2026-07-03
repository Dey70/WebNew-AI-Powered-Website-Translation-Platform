import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase/admin";

const KEY_PREFIX_LABEL = "wn_live_";
const PREFIX_DISPLAY_LENGTH = 12; // e.g. "wn_live_a1B2" -- long enough to be a useful lookup key

/**
 * Generates a new raw API key. Format: wn_live_<base64url random>.
 * The raw key is only ever returned here and printed once by the onboarding
 * script -- callers must hash it before persisting anything.
 */
export function generateApiKey() {
  const raw = KEY_PREFIX_LABEL + crypto.randomBytes(24).toString("base64url");
  return { raw, prefix: raw.slice(0, PREFIX_DISPLAY_LENGTH) };
}

/**
 * sha256(rawKey + API_KEY_PEPPER). The pepper is an app-wide secret (not a
 * per-row salt) -- its job is "a DB dump alone can't be used to replay keys,"
 * not brute-force resistance, since the key itself already has ~192 bits of
 * entropy.
 */
export function hashApiKey(rawKey) {
  const pepper = process.env.API_KEY_PEPPER || "";
  return crypto.createHash("sha256").update(rawKey + pepper).digest("hex");
}

/**
 * Constant-time comparison of two hex strings. Safe to length-check first:
 * sha256 hex digests are always 64 chars, so a length mismatch reveals
 * nothing secret-dependent (it just means "not even the right shape").
 */
export function timingSafeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function normalizeHostname(hostname) {
  return String(hostname || "").trim().toLowerCase().replace(/^www\./, "");
}

function hostnameAllowed(hostname, allowedOrigins) {
  if (!hostname || !Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
    return false;
  }
  const normalized = normalizeHostname(hostname);
  return allowedOrigins.some((allowed) => normalizeHostname(allowed) === normalized);
}

/**
 * Resolves a site from a raw API key + the caller's hostname.
 * Returns { ok: true, siteId } or { ok: false, reason }.
 * reason is one of: missing_api_key | invalid_api_key | site_inactive | origin_not_allowed
 */
export async function resolveSiteFromApiKey(rawKey, hostname) {
  if (!rawKey || typeof rawKey !== "string") {
    return { ok: false, reason: "missing_api_key" };
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return { ok: false, reason: "invalid_api_key" };
  }

  const prefix = rawKey.slice(0, PREFIX_DISPLAY_LENGTH);
  const { data: keyRow, error: keyError } = await supabase
    .from("api_keys")
    .select("id, site_id, key_hash, is_active, revoked_at")
    .eq("key_prefix", prefix)
    .maybeSingle();

  if (keyError || !keyRow) {
    return { ok: false, reason: "invalid_api_key" };
  }

  const candidateHash = hashApiKey(rawKey);
  if (!timingSafeEqualHex(candidateHash, keyRow.key_hash)) {
    return { ok: false, reason: "invalid_api_key" };
  }

  if (!keyRow.is_active || keyRow.revoked_at) {
    return { ok: false, reason: "invalid_api_key" };
  }

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, is_active, allowed_origins")
    .eq("id", keyRow.site_id)
    .maybeSingle();

  if (siteError || !site) {
    return { ok: false, reason: "invalid_api_key" };
  }

  if (!site.is_active) {
    return { ok: false, reason: "site_inactive" };
  }

  if (!hostnameAllowed(hostname, site.allowed_origins)) {
    return { ok: false, reason: "origin_not_allowed" };
  }

  // Best-effort, non-blocking -- a failure here should never fail the request.
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id)
    .then(() => {})
    .catch(() => {});

  return { ok: true, siteId: site.id };
}
