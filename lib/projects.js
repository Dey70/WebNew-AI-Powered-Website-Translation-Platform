import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase/admin";

/**
 * All operations here are scoped by owner_id -- never touch a row without it.
 * Uses the service-role client (bypasses RLS), so this scoping in application
 * code IS the tenant boundary, same pattern as lib/history.js's site_id scoping.
 */

function slugify(name) {
  return (
    String(name || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "project"
  );
}

export async function createProject({ ownerId, name }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  const baseSlug = slugify(name);

  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? baseSlug : `${baseSlug}-${crypto.randomBytes(3).toString("hex")}`;
    const { data, error } = await supabase
      .from("projects")
      .insert({ owner_id: ownerId, name, slug })
      .select()
      .single();

    if (!error) return { ok: true, data };
    if (error.code !== "23505") {
      console.error("[projects] createProject failed:", error.message);
      return { ok: false, error: error.message };
    }
    // unique violation on (owner_id, slug) -- retry with a random suffix
  }

  return { ok: false, error: "slug_collision" };
}

export async function listProjects({ ownerId, includeArchived = false }) {
  const supabase = getServiceClient();
  if (!supabase) return [];

  let query = supabase
    .from("projects")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false });

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[projects] listProjects failed:", error.message);
    return [];
  }
  return data || [];
}

export async function getProject({ ownerId, id }) {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error) {
    console.error("[projects] getProject failed:", error.message);
    return null;
  }
  return data;
}

export async function renameProject({ ownerId, id, name }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  const { data, error } = await supabase
    .from("projects")
    .update({ name })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[projects] renameProject failed:", error.message);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data };
}

export async function setProjectArchived({ ownerId, id, archived }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  const { data, error } = await supabase
    .from("projects")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
    .eq("owner_id", ownerId)
    .select()
    .maybeSingle();

  if (error) {
    console.error("[projects] setProjectArchived failed:", error.message);
    return { ok: false, error: error.message };
  }
  if (!data) return { ok: false, error: "not_found" };
  return { ok: true, data };
}

export async function deleteProject({ ownerId, id }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: true };

  const { error } = await supabase.from("projects").delete().eq("id", id).eq("owner_id", ownerId);

  if (error) {
    console.error("[projects] deleteProject failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
