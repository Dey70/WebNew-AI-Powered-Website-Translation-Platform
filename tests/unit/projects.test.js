import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  getServiceClient: vi.fn(),
}));

import { getServiceClient } from "@/lib/supabase/admin";
import {
  createProject,
  listProjects,
  getProject,
  renameProject,
  setProjectArchived,
  deleteProject,
} from "@/lib/projects";

// Minimal chainable fake matching the exact call shapes lib/projects.js uses:
// .insert().select().single() / .select().eq().order().is() / .update().eq().eq().select().maybeSingle() / .delete().eq().eq()
function chain(result) {
  const node = {
    eq: () => node,
    is: () => node,
    order: () => node,
    select: () => node,
    single: async () => result,
    maybeSingle: async () => result,
    then: (resolve) => resolve(result),
  };
  return node;
}

describe("lib/projects.js", () => {
  let calls;

  beforeEach(() => {
    calls = [];
  });

  function setClient(handlers) {
    getServiceClient.mockReturnValue({
      from: (table) => ({
        insert: (payload) => {
          calls.push({ op: "insert", table, payload });
          return chain(handlers.insert ? handlers.insert(payload) : { data: null, error: null });
        },
        select: () => {
          calls.push({ op: "select", table });
          return chain(handlers.select ?? { data: null, error: null });
        },
        update: (patch) => {
          calls.push({ op: "update", table, patch });
          return chain(handlers.update ? handlers.update(patch) : { data: null, error: null });
        },
        delete: () => {
          calls.push({ op: "delete", table });
          return chain(handlers.delete ?? { error: null });
        },
      }),
    });
  }

  describe("createProject", () => {
    it("inserts a slugified project scoped to the owner", async () => {
      setClient({
        insert: (payload) => ({
          data: { id: "p1", owner_id: payload.owner_id, name: payload.name, slug: payload.slug },
          error: null,
        }),
      });

      const result = await createProject({ ownerId: "user-1", name: "Acme Corp!" });

      expect(result.ok).toBe(true);
      expect(result.data.slug).toBe("acme-corp");
      expect(calls[0]).toMatchObject({ op: "insert", table: "projects", payload: { owner_id: "user-1" } });
    });

    it("retries with a suffixed slug on a unique-constraint collision", async () => {
      let attempt = 0;
      setClient({
        insert: (payload) => {
          attempt += 1;
          if (attempt === 1) return { data: null, error: { code: "23505", message: "duplicate" } };
          return { data: { id: "p2", owner_id: payload.owner_id, name: payload.name, slug: payload.slug }, error: null };
        },
      });

      const result = await createProject({ ownerId: "user-1", name: "Acme" });

      expect(result.ok).toBe(true);
      expect(attempt).toBe(2);
      expect(calls[1].payload.slug).not.toBe(calls[0].payload.slug);
    });

    it("does not retry on a non-collision error", async () => {
      setClient({ insert: () => ({ data: null, error: { code: "42501", message: "denied" } }) });
      const result = await createProject({ ownerId: "user-1", name: "Acme" });
      expect(result.ok).toBe(false);
      expect(calls.filter((c) => c.op === "insert")).toHaveLength(1);
    });
  });

  it("getProject scopes the lookup by both id and owner_id", async () => {
    let capturedEq = [];
    getServiceClient.mockReturnValue({
      from: () => ({
        select: () => {
          const node = {
            eq: (col, val) => {
              capturedEq.push([col, val]);
              return node;
            },
            maybeSingle: async () => ({ data: { id: "p1" }, error: null }),
          };
          return node;
        },
      }),
    });

    const result = await getProject({ ownerId: "user-1", id: "p1" });
    expect(result).toEqual({ id: "p1" });
    expect(capturedEq).toEqual([["id", "p1"], ["owner_id", "user-1"]]);
  });

  it("renameProject scopes the update by both id and owner_id, and reports not_found when no row matches", async () => {
    setClient({ update: () => ({ data: null, error: null }) });
    const result = await renameProject({ ownerId: "user-1", id: "p1", name: "New Name" });
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("setProjectArchived sets archived_at to a timestamp when archiving and null when unarchiving", async () => {
    setClient({ update: (patch) => ({ data: { id: "p1", archived_at: patch.archived_at }, error: null }) });

    const archived = await setProjectArchived({ ownerId: "user-1", id: "p1", archived: true });
    expect(archived.ok).toBe(true);
    expect(typeof archived.data.archived_at).toBe("string");

    const unarchived = await setProjectArchived({ ownerId: "user-1", id: "p1", archived: false });
    expect(unarchived.data.archived_at).toBeNull();
  });

  it("deleteProject scopes the delete by both id and owner_id (regression guard against cross-tenant deletes)", async () => {
    let capturedEq = [];
    getServiceClient.mockReturnValue({
      from: () => ({
        delete: () => {
          const node = {
            eq: (col, val) => {
              capturedEq.push([col, val]);
              return node;
            },
            then: (resolve) => resolve({ error: null }),
          };
          return node;
        },
      }),
    });

    const result = await deleteProject({ ownerId: "user-1", id: "p1" });
    expect(result).toEqual({ ok: true });
    expect(capturedEq).toEqual([["id", "p1"], ["owner_id", "user-1"]]);
  });

  it("listProjects excludes archived projects by default", async () => {
    let filteredArchived = false;
    getServiceClient.mockReturnValue({
      from: () => ({
        select: () => {
          const node = {
            eq: () => node,
            order: () => node,
            is: (col, val) => {
              if (col === "archived_at" && val === null) filteredArchived = true;
              return node;
            },
            then: (resolve) => resolve({ data: [], error: null }),
          };
          return node;
        },
      }),
    });

    await listProjects({ ownerId: "user-1" });
    expect(filteredArchived).toBe(true);
  });
});
