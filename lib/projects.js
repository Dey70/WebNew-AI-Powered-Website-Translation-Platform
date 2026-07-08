import crypto from "crypto";
import { getServiceClient } from "@/lib/supabase/admin";

/**
 * Ownership (owner_id) is unchanged and owner-only actions still filter by
 * it directly. Shared access (project_members) can't be expressed as a
 * single WHERE clause, so read/operational functions take a userId and run
 * an explicit access check first, then proceed scoped by primary key --
 * still safe, the check happens synchronously before any read/mutation.
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

export async function userHasProjectAccess({ userId, projectId }) {
  const supabase = getServiceClient();
  if (!supabase) return false;

  const { data: project, error } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", userId)
    .maybeSingle();

  if (!error && project) return true;

  const { data: membership } = await supabase
    .from("project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!membership;
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

export async function listProjects({ userId, includeArchived = false }) {
  const supabase = getServiceClient();
  if (!supabase) return [];

  let ownedQuery = supabase.from("projects").select("*").eq("owner_id", userId);
  if (!includeArchived) ownedQuery = ownedQuery.is("archived_at", null);

  const { data: owned, error: ownedError } = await ownedQuery;
  if (ownedError) {
    console.error("[projects] listProjects (owned) failed:", ownedError.message);
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("project_members")
    .select("project_id")
    .eq("user_id", userId);

  if (membershipError) {
    console.error("[projects] listProjects (memberships) failed:", membershipError.message);
  }

  const memberProjectIds = (memberships || []).map((m) => m.project_id);
  let memberProjects = [];
  if (memberProjectIds.length > 0) {
    let memberQuery = supabase.from("projects").select("*").in("id", memberProjectIds);
    if (!includeArchived) memberQuery = memberQuery.is("archived_at", null);
    const { data, error } = await memberQuery;
    if (error) {
      console.error("[projects] listProjects (member projects) failed:", error.message);
    }
    memberProjects = data || [];
  }

  const byId = new Map();
  for (const p of [...(owned || []), ...memberProjects]) byId.set(p.id, p);

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

export async function getProject({ userId, id }) {
  const supabase = getServiceClient();
  if (!supabase) return null;

  if (!(await userHasProjectAccess({ userId, projectId: id }))) return null;

  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();

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

export async function listMembers({ userId, projectId }) {
  const supabase = getServiceClient();
  if (!supabase) return [];

  if (!(await userHasProjectAccess({ userId, projectId }))) return [];

  const { data, error } = await supabase
    .from("project_members")
    .select("id, user_id, created_at, profiles(email, full_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[projects] listMembers failed:", error.message);
    return [];
  }
  return data || [];
}

export async function inviteMember({ ownerId, projectId, email }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, owner_id")
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (projectError || !project) return { ok: false, error: "not_found" };

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();

  if (profileError || !profile) return { ok: false, error: "no_account_for_email" };

  if (profile.id === project.owner_id) return { ok: false, error: "already_owner" };

  const { data, error } = await supabase
    .from("project_members")
    .insert({ project_id: projectId, user_id: profile.id })
    .select("id, user_id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: "already_a_member" };
    console.error("[projects] inviteMember failed:", error.message);
    return { ok: false, error: error.message };
  }

  return { ok: true, data: { ...data, email: profile.email } };
}

export async function removeMember({ ownerId, projectId, memberUserId }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, error: "not_configured" };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (projectError || !project) return { ok: false, error: "not_found" };

  const { error } = await supabase
    .from("project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", memberUserId);

  if (error) {
    console.error("[projects] removeMember failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
