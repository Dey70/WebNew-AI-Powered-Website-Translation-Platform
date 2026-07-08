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
  userHasProjectAccess,
  listMembers,
  inviteMember,
  removeMember,
  listPendingInvitesForUser,
  respondToInvite,
} from "@/lib/projects";

// Minimal chainable fake matching the exact call shapes lib/projects.js uses.
function chain(result) {
  const node = {
    eq: () => node,
    in: () => node,
    is: () => node,
    ilike: () => node,
    order: () => node,
    select: () => node,
    single: async () => result,
    maybeSingle: async () => result,
    then: (resolve) => resolve(result),
  };
  return node;
}

function makeClient(tableHandlers) {
  const calls = [];
  const client = {
    from: (table) => {
      const h = tableHandlers[table] || {};
      return {
        insert: (payload) => {
          calls.push({ op: "insert", table, payload });
          return chain(h.insert ? h.insert(payload) : { data: null, error: null });
        },
        select: () => {
          calls.push({ op: "select", table });
          return chain(typeof h.select === "function" ? h.select() : h.select ?? { data: null, error: null });
        },
        update: (patch) => {
          calls.push({ op: "update", table, patch });
          return chain(h.update ? h.update(patch) : { data: null, error: null });
        },
        delete: () => {
          calls.push({ op: "delete", table });
          return chain(h.delete ?? { error: null });
        },
      };
    },
    __calls: calls,
  };
  return client;
}

describe("lib/projects.js", () => {
  beforeEach(() => {
    getServiceClient.mockReset();
  });

  describe("createProject", () => {
    it("inserts a slugified project scoped to the owner", async () => {
      const client = makeClient({
        projects: {
          insert: (payload) => ({
            data: { id: "p1", owner_id: payload.owner_id, name: payload.name, slug: payload.slug },
            error: null,
          }),
        },
      });
      getServiceClient.mockReturnValue(client);

      const result = await createProject({ ownerId: "user-1", name: "Acme Corp!" });

      expect(result.ok).toBe(true);
      expect(result.data.slug).toBe("acme-corp");
      expect(client.__calls[0]).toMatchObject({
        op: "insert",
        table: "projects",
        payload: { owner_id: "user-1" },
      });
    });

    it("retries with a suffixed slug on a unique-constraint collision", async () => {
      let attempt = 0;
      const client = makeClient({
        projects: {
          insert: (payload) => {
            attempt += 1;
            if (attempt === 1) return { data: null, error: { code: "23505", message: "duplicate" } };
            return {
              data: { id: "p2", owner_id: payload.owner_id, name: payload.name, slug: payload.slug },
              error: null,
            };
          },
        },
      });
      getServiceClient.mockReturnValue(client);

      const result = await createProject({ ownerId: "user-1", name: "Acme" });

      expect(result.ok).toBe(true);
      expect(attempt).toBe(2);
      const inserts = client.__calls.filter((c) => c.op === "insert");
      expect(inserts[1].payload.slug).not.toBe(inserts[0].payload.slug);
    });
  });

  describe("userHasProjectAccess", () => {
    it("returns true for the owner", async () => {
      getServiceClient.mockReturnValue(
        makeClient({ projects: { select: () => ({ data: { id: "p1" }, error: null }) } })
      );
      expect(await userHasProjectAccess({ userId: "owner-1", projectId: "p1" })).toBe(true);
    });

    it("returns true for a member (not the owner)", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          projects: { select: () => ({ data: null, error: null }) },
          project_members: { select: () => ({ data: { id: "m1" }, error: null }) },
        })
      );
      expect(await userHasProjectAccess({ userId: "member-1", projectId: "p1" })).toBe(true);
    });

    it("returns false for a stranger (regression guard)", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          projects: { select: () => ({ data: null, error: null }) },
          project_members: { select: () => ({ data: null, error: null }) },
        })
      );
      expect(await userHasProjectAccess({ userId: "stranger", projectId: "p1" })).toBe(false);
    });

    it("returns false for a pending (not-yet-accepted) invite -- the core security property of the invite flow", async () => {
      // A real project_members row exists, but with status:"pending". This
      // fake actually models column filtering (unlike the generic makeClient
      // helper, which ignores .eq() args) so the test genuinely exercises
      // the .eq("status", "accepted") filter in the real query -- if that
      // filter were ever removed, this fake row would incorrectly match and
      // the test would fail.
      const fakeRow = { id: "m1", project_id: "p1", user_id: "invited-1", status: "pending" };
      getServiceClient.mockReturnValue({
        from: (table) => {
          if (table === "projects") return { select: () => chain({ data: null, error: null }) };
          return {
            select: () => {
              const filters = {};
              const node = {
                eq: (col, val) => {
                  filters[col] = val;
                  return node;
                },
                maybeSingle: async () => {
                  const matches = Object.entries(filters).every(([k, v]) => fakeRow[k] === v);
                  return { data: matches ? fakeRow : null, error: null };
                },
              };
              return node;
            },
          };
        },
      });

      expect(await userHasProjectAccess({ userId: "invited-1", projectId: "p1" })).toBe(false);
    });
  });

  describe("getProject", () => {
    it("returns the project for the owner, with the owner's email attached", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          projects: { select: () => ({ data: { id: "p1", owner_id: "owner-1" }, error: null }) },
          profiles: { select: () => ({ data: { email: "owner@x.com" }, error: null }) },
        })
      );
      const result = await getProject({ userId: "owner-1", id: "p1" });
      expect(result).toEqual({ id: "p1", owner_id: "owner-1", owner_email: "owner@x.com" });
    });

    it("returns null for a stranger without owner or member access (regression guard)", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          projects: { select: () => ({ data: null, error: null }) },
          project_members: { select: () => ({ data: null, error: null }) },
        })
      );
      expect(await getProject({ userId: "stranger", id: "p1" })).toBeNull();
    });
  });

  it("renameProject scopes the update by both id and owner_id, and reports not_found when no row matches", async () => {
    getServiceClient.mockReturnValue(makeClient({ projects: { update: () => ({ data: null, error: null }) } }));
    const result = await renameProject({ ownerId: "user-1", id: "p1", name: "New Name" });
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("setProjectArchived sets archived_at to a timestamp when archiving and null when unarchiving", async () => {
    getServiceClient.mockReturnValue(
      makeClient({
        projects: { update: (patch) => ({ data: { id: "p1", archived_at: patch.archived_at }, error: null }) },
      })
    );

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

  describe("listProjects", () => {
    it("returns owned projects", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          projects: { select: () => ({ data: [{ id: "p1", created_at: "2026-01-01" }], error: null }) },
          project_members: { select: () => ({ data: [], error: null }) },
        })
      );
      const result = await listProjects({ userId: "user-1" });
      expect(result).toEqual([{ id: "p1", created_at: "2026-01-01" }]);
    });

    it("returns projects the user is a member of, not just owned ones", async () => {
      // projects is queried twice (owned, then member .in()) -- this counter
      // must live outside `from` so it's shared across both invocations.
      let projectsCallCount = 0;
      getServiceClient.mockReturnValue({
        from: (table) => {
          if (table === "project_members") {
            return { select: () => chain({ data: [{ project_id: "p2" }], error: null }) };
          }
          return {
            select: () => {
              projectsCallCount += 1;
              return chain(
                projectsCallCount === 1
                  ? { data: [], error: null } // owned query: none
                  : { data: [{ id: "p2", created_at: "2026-01-02" }], error: null } // member .in() query
              );
            },
          };
        },
      });

      const result = await listProjects({ userId: "member-1" });
      expect(result).toEqual([{ id: "p2", created_at: "2026-01-02" }]);
    });

    it("excludes archived projects by default", async () => {
      let filteredArchived = false;
      getServiceClient.mockReturnValue({
        from: (table) => ({
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

      await listProjects({ userId: "user-1" });
      expect(filteredArchived).toBe(true);
    });
  });

  describe("inviteMember", () => {
    it("reports not_found when the inviter doesn't own the project", async () => {
      getServiceClient.mockReturnValue(makeClient({ projects: { select: () => ({ data: null, error: null }) } }));
      const result = await inviteMember({ ownerId: "not-owner", projectId: "p1", email: "a@b.com" });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("reports no_account_for_email when no profile matches", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          projects: { select: () => ({ data: { id: "p1", owner_id: "owner-1" }, error: null }) },
          profiles: { select: () => ({ data: null, error: null }) },
        })
      );
      const result = await inviteMember({ ownerId: "owner-1", projectId: "p1", email: "nobody@x.com" });
      expect(result).toEqual({ ok: false, error: "no_account_for_email" });
    });

    it("reports already_owner when inviting yourself", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          projects: { select: () => ({ data: { id: "p1", owner_id: "owner-1" }, error: null }) },
          profiles: { select: () => ({ data: { id: "owner-1", email: "owner@x.com" }, error: null }) },
        })
      );
      const result = await inviteMember({ ownerId: "owner-1", projectId: "p1", email: "owner@x.com" });
      expect(result).toEqual({ ok: false, error: "already_owner" });
    });

    it("reports already_a_member (pre-check) when an accepted row already exists, without attempting an insert", async () => {
      const client = makeClient({
        projects: { select: () => ({ data: { id: "p1", owner_id: "owner-1" }, error: null }) },
        profiles: { select: () => ({ data: { id: "user-2", email: "b@x.com" }, error: null }) },
        project_members: { select: () => ({ data: { status: "accepted" }, error: null }) },
      });
      getServiceClient.mockReturnValue(client);

      const result = await inviteMember({ ownerId: "owner-1", projectId: "p1", email: "b@x.com" });
      expect(result).toEqual({ ok: false, error: "already_a_member" });
      expect(client.__calls.some((c) => c.table === "project_members" && c.op === "insert")).toBe(false);
    });

    it("reports invite_already_pending (distinct from already_a_member) when the existing row hasn't been accepted yet", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          projects: { select: () => ({ data: { id: "p1", owner_id: "owner-1" }, error: null }) },
          profiles: { select: () => ({ data: { id: "user-2", email: "b@x.com" }, error: null }) },
          project_members: { select: () => ({ data: { status: "pending" }, error: null }) },
        })
      );
      const result = await inviteMember({ ownerId: "owner-1", projectId: "p1", email: "b@x.com" });
      expect(result).toEqual({ ok: false, error: "invite_already_pending" });
    });

    it("reports already_a_member on a unique-constraint conflict (race-condition fallback)", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          projects: { select: () => ({ data: { id: "p1", owner_id: "owner-1" }, error: null }) },
          profiles: { select: () => ({ data: { id: "user-2", email: "b@x.com" }, error: null }) },
          project_members: {
            select: () => ({ data: null, error: null }),
            insert: () => ({ data: null, error: { code: "23505", message: "dup" } }),
          },
        })
      );
      const result = await inviteMember({ ownerId: "owner-1", projectId: "p1", email: "b@x.com" });
      expect(result).toEqual({ ok: false, error: "already_a_member" });
    });

    it("adds the member as pending on success", async () => {
      const client = makeClient({
        projects: { select: () => ({ data: { id: "p1", owner_id: "owner-1" }, error: null }) },
        profiles: { select: () => ({ data: { id: "user-2", email: "b@x.com" }, error: null }) },
        project_members: {
          select: () => ({ data: null, error: null }),
          insert: () => ({ data: { id: "m1", user_id: "user-2", status: "pending", created_at: "2026-01-01" }, error: null }),
        },
      });
      getServiceClient.mockReturnValue(client);

      const result = await inviteMember({ ownerId: "owner-1", projectId: "p1", email: "b@x.com" });
      expect(result.ok).toBe(true);
      expect(result.data.user_id).toBe("user-2");
      expect(result.data.status).toBe("pending");

      const insertCall = client.__calls.find((c) => c.table === "project_members" && c.op === "insert");
      expect(insertCall.payload.status).toBe("pending");
    });
  });

  describe("removeMember", () => {
    it("reports not_found when the remover doesn't own the project", async () => {
      getServiceClient.mockReturnValue(makeClient({ projects: { select: () => ({ data: null, error: null }) } }));
      const result = await removeMember({ ownerId: "not-owner", projectId: "p1", memberUserId: "user-2" });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("removes the member scoped by both project_id and user_id", async () => {
      const capturedEq = [];
      getServiceClient.mockReturnValue({
        from: (table) => {
          if (table === "projects") {
            return { select: () => chain({ data: { id: "p1" }, error: null }) };
          }
          const node = {
            eq: (col, val) => {
              capturedEq.push([col, val]);
              return node;
            },
            then: (resolve) => resolve({ error: null }),
          };
          return { delete: () => node };
        },
      });

      const result = await removeMember({ ownerId: "owner-1", projectId: "p1", memberUserId: "user-2" });
      expect(result).toEqual({ ok: true });
      expect(capturedEq).toEqual([["project_id", "p1"], ["user_id", "user-2"]]);
    });
  });

  describe("listMembers", () => {
    it("returns an empty list for a stranger without access", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          projects: { select: () => ({ data: null, error: null }) },
          project_members: { select: () => ({ data: null, error: null }) },
        })
      );
      expect(await listMembers({ userId: "stranger", projectId: "p1" })).toEqual([]);
    });

    it("returns the member list for the owner", async () => {
      getServiceClient.mockReturnValue({
        from: (table) => {
          if (table === "projects") {
            return { select: () => chain({ data: { id: "p1" }, error: null }) };
          }
          // project_members: access-check call (maybeSingle) then the real list call (order/thenable)
          return {
            select: () => {
              const node = {
                eq: () => node,
                order: () => node,
                maybeSingle: async () => ({ data: null, error: null }),
                then: (resolve) => resolve({ data: [{ id: "m1", user_id: "user-2" }], error: null }),
              };
              return node;
            },
          };
        },
      });

      const result = await listMembers({ userId: "owner-1", projectId: "p1" });
      expect(result).toEqual([{ id: "m1", user_id: "user-2" }]);
    });
  });

  describe("respondToInvite", () => {
    it("reports not_found when there is no pending invite for that user/project", async () => {
      getServiceClient.mockReturnValue(
        makeClient({ project_members: { select: () => ({ data: null, error: null }) } })
      );
      const result = await respondToInvite({ userId: "invited-1", projectId: "p1", accept: true });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("reports not_found for an already-accepted row (nothing left to respond to)", async () => {
      getServiceClient.mockReturnValue(
        makeClient({
          project_members: { select: () => ({ data: { id: "m1", status: "accepted" }, error: null }) },
        })
      );
      const result = await respondToInvite({ userId: "invited-1", projectId: "p1", accept: true });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("only lets the invited user respond to their own invite (scoped by user_id, regression guard)", async () => {
      const capturedEq = [];
      getServiceClient.mockReturnValue({
        from: () => ({
          select: () => {
            const node = {
              eq: (col, val) => {
                capturedEq.push([col, val]);
                return node;
              },
              maybeSingle: async () => ({ data: { id: "m1", status: "pending" }, error: null }),
            };
            return node;
          },
          update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) }),
        }),
      });

      await respondToInvite({ userId: "invited-1", projectId: "p1", accept: true });
      expect(capturedEq).toEqual([["project_id", "p1"], ["user_id", "invited-1"]]);
    });

    it("accept updates status to accepted", async () => {
      const client = makeClient({
        project_members: {
          select: () => ({ data: { id: "m1", status: "pending" }, error: null }),
          update: () => ({ error: null }),
        },
      });
      getServiceClient.mockReturnValue(client);

      const result = await respondToInvite({ userId: "invited-1", projectId: "p1", accept: true });
      expect(result).toEqual({ ok: true, accepted: true });
      const updateCall = client.__calls.find((c) => c.table === "project_members" && c.op === "update");
      expect(updateCall.patch.status).toBe("accepted");
    });

    it("decline deletes the row outright rather than leaving a declined-state row", async () => {
      const client = makeClient({
        project_members: {
          select: () => ({ data: { id: "m1", status: "pending" }, error: null }),
          delete: () => ({ error: null }),
        },
      });
      getServiceClient.mockReturnValue(client);

      const result = await respondToInvite({ userId: "invited-1", projectId: "p1", accept: false });
      expect(result).toEqual({ ok: true, accepted: false });
      expect(client.__calls.some((c) => c.table === "project_members" && c.op === "delete")).toBe(true);
      expect(client.__calls.some((c) => c.table === "project_members" && c.op === "update")).toBe(false);
    });
  });

  describe("listPendingInvitesForUser", () => {
    it("returns an empty list when there are no pending invites", async () => {
      getServiceClient.mockReturnValue(
        makeClient({ project_members: { select: () => ({ data: [], error: null }) } })
      );
      expect(await listPendingInvitesForUser({ userId: "invited-1" })).toEqual([]);
    });

    it("attaches the project name and inviting owner's email to each invite", async () => {
      getServiceClient.mockReturnValue({
        from: (table) => {
          if (table === "project_members") {
            return {
              select: () =>
                chain({
                  data: [{ id: "m1", project_id: "p1", created_at: "2026-01-01" }],
                  error: null,
                }),
            };
          }
          if (table === "projects") {
            return { select: () => chain({ data: [{ id: "p1", name: "Acme", owner_id: "owner-1" }], error: null }) };
          }
          // profiles
          return { select: () => chain({ data: [{ id: "owner-1", email: "owner@x.com" }], error: null }) };
        },
      });

      const result = await listPendingInvitesForUser({ userId: "invited-1" });
      expect(result).toEqual([
        {
          id: "m1",
          project_id: "p1",
          created_at: "2026-01-01",
          projectName: "Acme",
          ownerEmail: "owner@x.com",
        },
      ]);
    });
  });
});
