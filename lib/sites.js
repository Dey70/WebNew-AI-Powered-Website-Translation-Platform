import { getServiceClient } from "@/lib/supabase/admin";
import { generateApiKey, hashApiKey, normalizeHostname } from "@/lib/auth/apiKeys";
import { userHasProjectAccess } from "@/lib/projects";

/**
 * Ownership (site.owner_id, the creator) still gates sites with no project.
 * Sites linked to a project are shared with everyone who has access to that
 * project (owner or member) -- userCanAccessSite is the single access check
 * every function here runs before reading/mutating a site, since "owner OR
 * project member" can't be expressed as a single WHERE clause. The check
 * happens synchronously first, then the operation proceeds scoped by the
 * site's own id -- same as the "explicit check, then act" pattern used
 * throughout lib/projects.js.
 */

function normalizeOrigins(allowedOrigins) {
  const list = Array.isArray(allowedOrigins) ? allowedOrigins : [];
  const normalized = list.map(normalizeHostname).filter(Boolean);
  return Array.from(new Set(normalized));
}

export async function userCanAccessSite({ userId, siteId }) {
  const supabase = getServiceClient();
  if (!supabase) return false;

  const { data: site, error } = await supabase
    .from("sites")
    .select("id, owner_id, project_id")
    .eq("id", siteId)
    .maybeSingle();

  if (error || !site) return false;
  if (site.owner_id === userId) return true;
  if (site.project_id) return userHasProjectAccess({ userId, projectId: site.project_id });
  return false;
}

export async function createSite({ userId, userEmail, projectId, name, allowedOrigins }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  if (projectId) {
    const hasAccess = await userHasProjectAccess({ userId, projectId });
    if (!hasAccess) return { ok: false, error: "project_not_found" };
  }

  const origins = normalizeOrigins(allowedOrigins);
  if (origins.length === 0) return { ok: false, error: "at_least_one_origin_required" };

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      name,
      owner_email: userEmail,
      owner_id: userId,
      project_id: projectId || null,
      allowed_origins: origins,
    })
    .select()
    .single();

  if (siteError) {
    console.error("[sites] createSite failed:", siteError.message);
    return { ok: false, error: siteError.message };
  }

  const { raw, prefix } = generateApiKey();
  const { error: keyError } = await supabase
    .from("api_keys")
    .insert({ site_id: site.id, key_prefix: prefix, key_hash: hashApiKey(raw) });

  if (keyError) {
    console.error("[sites] createSite key insert failed:", keyError.message);
    // Roll back the orphaned site row rather than leaving a keyless site behind.
    await supabase.from("sites").delete().eq("id", site.id);
    return { ok: false, error: keyError.message };
  }

  return { ok: true, data: site, apiKey: raw };
}

export async function listSites({ userId, projectId }) {
  const supabase = getServiceClient();
  if (!supabase) return [];

  // With a projectId, the caller (Route Handler) has already verified project
  // access -- every site in the project is visible to everyone with access to
  // it, regardless of which member originally created it. Without a
  // projectId, this stays the simpler, owner-only "all my sites" shape (not
  // used by any current UI, so it isn't worth the same member-aware treatment
  // listProjects got).
  let query = supabase.from("sites").select("*").order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  } else {
    query = query.eq("owner_id", userId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[sites] listSites failed:", error.message);
    return [];
  }
  return data || [];
}

export async function getSite({ userId, id }) {
  const supabase = getServiceClient();
  if (!supabase) return null;

  if (!(await userCanAccessSite({ userId, siteId: id }))) return null;

  const { data: site, error } = await supabase.from("sites").select("*").eq("id", id).maybeSingle();

  if (error || !site) {
    if (error) console.error("[sites] getSite failed:", error.message);
    return null;
  }

  const { data: keys, error: keysError } = await supabase
    .from("api_keys")
    .select("id, label, key_prefix, is_active, created_at, last_used_at, revoked_at")
    .eq("site_id", id)
    .order("created_at", { ascending: false });

  if (keysError) {
    console.error("[sites] getSite key lookup failed:", keysError.message);
  }

  return { ...site, apiKeys: keys || [] };
}

const SUPPORTED_PROVIDERS = ["mymemory", "deepl"];

export async function updateSite({ userId, id, name, allowedOrigins, isActive, provider }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  if (!(await userCanAccessSite({ userId, siteId: id }))) return { ok: false, error: "not_found" };

  const patch = {};
  if (typeof name === "string") patch.name = name;
  if (allowedOrigins !== undefined) {
    const origins = normalizeOrigins(allowedOrigins);
    if (origins.length === 0) return { ok: false, error: "at_least_one_origin_required" };
    patch.allowed_origins = origins;
  }
  if (typeof isActive === "boolean") patch.is_active = isActive;
  if (provider !== undefined) {
    if (!SUPPORTED_PROVIDERS.includes(provider)) return { ok: false, error: "unsupported_provider" };
    patch.provider = provider;
  }

  if (Object.keys(patch).length === 0) return { ok: false, error: "nothing_to_update" };

  const { data, error } = await supabase
    .from("sites")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[sites] updateSite failed:", error.message);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data };
}

export async function deleteSite({ userId, id }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: true };

  if (!(await userCanAccessSite({ userId, siteId: id }))) return { ok: false, error: "not_found" };

  const { error } = await supabase.from("sites").delete().eq("id", id);

  if (error) {
    console.error("[sites] deleteSite failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

const MAX_ACTIVE_KEYS_PER_SITE = 5;

export async function createApiKey({ userId, siteId, label }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  if (!(await userCanAccessSite({ userId, siteId }))) {
    return { ok: false, error: "not_found" };
  }

  const { count, error: countError } = await supabase
    .from("api_keys")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("is_active", true);

  if (countError) {
    console.error("[sites] createApiKey count check failed:", countError.message);
    return { ok: false, error: countError.message };
  }
  if ((count || 0) >= MAX_ACTIVE_KEYS_PER_SITE) {
    return { ok: false, error: "too_many_active_keys" };
  }

  const { raw, prefix } = generateApiKey();
  const { error: keyError } = await supabase
    .from("api_keys")
    .insert({ site_id: siteId, key_prefix: prefix, key_hash: hashApiKey(raw), label: label || null });

  if (keyError) {
    console.error("[sites] createApiKey failed:", keyError.message);
    return { ok: false, error: keyError.message };
  }

  return { ok: true, apiKey: raw };
}

export async function revokeApiKey({ userId, siteId, keyId }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  if (!(await userCanAccessSite({ userId, siteId }))) {
    return { ok: false, error: "not_found" };
  }

  const { data, error } = await supabase
    .from("api_keys")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("id", keyId)
    .eq("site_id", siteId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[sites] revokeApiKey failed:", error.message);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true };
}
