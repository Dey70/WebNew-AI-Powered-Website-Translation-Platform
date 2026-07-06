import { getServiceClient } from "@/lib/supabase/admin";
import { generateApiKey, hashApiKey, normalizeHostname } from "@/lib/auth/apiKeys";
import { getProject } from "@/lib/projects";

/**
 * All operations here are scoped by owner_id -- never touch a row without it.
 * Uses the service-role client (bypasses RLS); this scoping in application
 * code IS the tenant boundary, same "service-role + explicit filter" pattern
 * lib/auth/apiKeys.js already relies on for site_id.
 */

function normalizeOrigins(allowedOrigins) {
  const list = Array.isArray(allowedOrigins) ? allowedOrigins : [];
  const normalized = list.map(normalizeHostname).filter(Boolean);
  return Array.from(new Set(normalized));
}

export async function createSite({ ownerId, ownerEmail, projectId, name, allowedOrigins }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  if (projectId) {
    const project = await getProject({ ownerId, id: projectId });
    if (!project) return { ok: false, error: "project_not_found" };
  }

  const origins = normalizeOrigins(allowedOrigins);
  if (origins.length === 0) return { ok: false, error: "at_least_one_origin_required" };

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      name,
      owner_email: ownerEmail,
      owner_id: ownerId,
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

export async function listSites({ ownerId, projectId }) {
  const supabase = getServiceClient();
  if (!supabase) return [];

  let query = supabase
    .from("sites")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (projectId) {
    query = query.eq("project_id", projectId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[sites] listSites failed:", error.message);
    return [];
  }
  return data || [];
}

export async function getSite({ ownerId, id }) {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data: site, error } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error("[sites] getSite failed:", error.message);
    return null;
  }
  if (!site) return null;

  const { data: keys, error: keysError } = await supabase
    .from("api_keys")
    .select("id, key_prefix, is_active, created_at, last_used_at, revoked_at")
    .eq("site_id", id)
    .order("created_at", { ascending: false });

  if (keysError) {
    console.error("[sites] getSite key lookup failed:", keysError.message);
  }

  return { ...site, apiKeys: keys || [] };
}

export async function updateSite({ ownerId, id, name, allowedOrigins, isActive }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  const patch = {};
  if (typeof name === "string") patch.name = name;
  if (allowedOrigins !== undefined) {
    const origins = normalizeOrigins(allowedOrigins);
    if (origins.length === 0) return { ok: false, error: "at_least_one_origin_required" };
    patch.allowed_origins = origins;
  }
  if (typeof isActive === "boolean") patch.is_active = isActive;

  if (Object.keys(patch).length === 0) return { ok: false, error: "nothing_to_update" };

  const { data, error } = await supabase
    .from("sites")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[sites] updateSite failed:", error.message);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data };
}

export async function deleteSite({ ownerId, id }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: true };

  const { error } = await supabase.from("sites").delete().eq("id", id).eq("owner_id", ownerId);

  if (error) {
    console.error("[sites] deleteSite failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function revokeAndRegenerateKey({ ownerId, siteId }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (siteError || !site) return { ok: false, error: "not_found" };

  const { error: revokeError } = await supabase
    .from("api_keys")
    .update({ is_active: false, revoked_at: new Date().toISOString() })
    .eq("site_id", siteId)
    .eq("is_active", true);

  if (revokeError) {
    console.error("[sites] revokeAndRegenerateKey revoke step failed:", revokeError.message);
    return { ok: false, error: revokeError.message };
  }

  const { raw, prefix } = generateApiKey();
  const { error: keyError } = await supabase
    .from("api_keys")
    .insert({ site_id: siteId, key_prefix: prefix, key_hash: hashApiKey(raw) });

  if (keyError) {
    console.error("[sites] revokeAndRegenerateKey insert step failed:", keyError.message);
    return { ok: false, error: keyError.message };
  }

  return { ok: true, apiKey: raw };
}
