import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  getServiceClient: vi.fn(),
}));
vi.mock("@/lib/projects", () => ({
  userHasProjectAccess: vi.fn(),
}));

import { getServiceClient } from "@/lib/supabase/admin";
import { userHasProjectAccess } from "@/lib/projects";
import {
  createSite,
  listSites,
  getSite,
  updateSite,
  deleteSite,
  createApiKey,
  revokeApiKey,
  userCanAccessSite,
} from "@/lib/sites";

// Minimal chainable fake, keyed per table, matching lib/sites.js's exact call shapes.
function chain(result) {
  const node = {
    eq: () => node,
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
          return chain(h.select ? h.select() : { data: null, error: null });
        },
        update: (patch) => {
          calls.push({ op: "update", table, patch });
          return chain(h.update ? h.update(patch) : { data: null, error: null });
        },
        delete: () => {
          calls.push({ op: "delete", table });
          return chain(h.delete ? h.delete() : { error: null });
        },
      };
    },
    __calls: calls,
  };
  return client;
}

describe("lib/sites.js", () => {
  beforeEach(() => {
    getServiceClient.mockReset();
    userHasProjectAccess.mockReset();
  });

  describe("userCanAccessSite", () => {
    it("returns true for the site's own owner_id", async () => {
      getServiceClient.mockReturnValue(
        makeClient({ sites: { select: () => ({ data: { id: "s1", owner_id: "user-1", project_id: null }, error: null }) } })
      );
      expect(await userCanAccessSite({ userId: "user-1", siteId: "s1" })).toBe(true);
    });

    it("returns true for a project member when the site has a project_id", async () => {
      userHasProjectAccess.mockResolvedValue(true);
      getServiceClient.mockReturnValue(
        makeClient({ sites: { select: () => ({ data: { id: "s1", owner_id: "someone-else", project_id: "p1" }, error: null }) } })
      );
      expect(await userCanAccessSite({ userId: "member-1", siteId: "s1" })).toBe(true);
      expect(userHasProjectAccess).toHaveBeenCalledWith({ userId: "member-1", projectId: "p1" });
    });

    it("denies a stranger when the site has no project_id (regression guard: no project to share membership through)", async () => {
      getServiceClient.mockReturnValue(
        makeClient({ sites: { select: () => ({ data: { id: "s1", owner_id: "someone-else", project_id: null }, error: null }) } })
      );
      expect(await userCanAccessSite({ userId: "stranger", siteId: "s1" })).toBe(false);
      expect(userHasProjectAccess).not.toHaveBeenCalled();
    });

    it("denies a stranger who isn't a member of the site's project", async () => {
      userHasProjectAccess.mockResolvedValue(false);
      getServiceClient.mockReturnValue(
        makeClient({ sites: { select: () => ({ data: { id: "s1", owner_id: "someone-else", project_id: "p1" }, error: null }) } })
      );
      expect(await userCanAccessSite({ userId: "stranger", siteId: "s1" })).toBe(false);
    });
  });

  describe("createSite", () => {
    it("requires at least one allowed origin", async () => {
      const client = makeClient({});
      getServiceClient.mockReturnValue(client);

      const result = await createSite({ userId: "user-1", userEmail: "a@b.com", name: "Site", allowedOrigins: [] });

      expect(result).toEqual({ ok: false, error: "at_least_one_origin_required" });
      expect(client.__calls).toHaveLength(0);
    });

    it("rejects a projectId the user doesn't have access to", async () => {
      userHasProjectAccess.mockResolvedValue(false);
      const client = makeClient({});
      getServiceClient.mockReturnValue(client);

      const result = await createSite({
        userId: "user-1",
        userEmail: "a@b.com",
        projectId: "someone-elses-project",
        name: "Site",
        allowedOrigins: ["example.com"],
      });

      expect(result).toEqual({ ok: false, error: "project_not_found" });
      expect(client.__calls).toHaveLength(0);
    });

    it("creates the site scoped to the creator, normalizes origins, and issues an API key", async () => {
      const client = makeClient({
        sites: {
          insert: (payload) => ({ data: { id: "site-1", ...payload }, error: null }),
        },
        api_keys: {
          insert: () => ({ data: null, error: null }),
        },
      });
      getServiceClient.mockReturnValue(client);

      const result = await createSite({
        userId: "user-1",
        userEmail: "a@b.com",
        name: "Site",
        allowedOrigins: ["WWW.Example.com", "example.com", "example.com"],
      });

      expect(result.ok).toBe(true);
      expect(typeof result.apiKey).toBe("string");
      expect(result.apiKey.startsWith("wn_live_")).toBe(true);

      const siteInsertCall = client.__calls.find((c) => c.table === "sites" && c.op === "insert");
      expect(siteInsertCall.payload.owner_id).toBe("user-1");
      expect(siteInsertCall.payload.allowed_origins).toEqual(["example.com"]); // normalized + deduped

      const keyInsertCall = client.__calls.find((c) => c.table === "api_keys" && c.op === "insert");
      expect(keyInsertCall.payload.site_id).toBe("site-1");
      expect(keyInsertCall.payload.key_hash).not.toBe(result.apiKey); // never stores the raw key
    });

    it("allows a project member (not just the project owner) to create a site in that project", async () => {
      userHasProjectAccess.mockResolvedValue(true);
      const client = makeClient({
        sites: { insert: (payload) => ({ data: { id: "site-1", ...payload }, error: null }) },
        api_keys: { insert: () => ({ data: null, error: null }) },
      });
      getServiceClient.mockReturnValue(client);

      const result = await createSite({
        userId: "member-1",
        userEmail: "member@x.com",
        projectId: "p1",
        name: "Site",
        allowedOrigins: ["example.com"],
      });

      expect(result.ok).toBe(true);
      expect(userHasProjectAccess).toHaveBeenCalledWith({ userId: "member-1", projectId: "p1" });
    });

    it("rolls back the site row if issuing its API key fails", async () => {
      const client = makeClient({
        sites: {
          insert: (payload) => ({ data: { id: "site-1", ...payload }, error: null }),
          delete: () => ({ error: null }),
        },
        api_keys: {
          insert: () => ({ data: null, error: { message: "insert failed" } }),
        },
      });
      getServiceClient.mockReturnValue(client);

      const result = await createSite({
        userId: "user-1",
        userEmail: "a@b.com",
        name: "Site",
        allowedOrigins: ["example.com"],
      });

      expect(result.ok).toBe(false);
      const rollbackDelete = client.__calls.find((c) => c.table === "sites" && c.op === "delete");
      expect(rollbackDelete).toBeTruthy();
    });
  });

  describe("getSite", () => {
    it("returns null when no site matches the id at all", async () => {
      getServiceClient.mockReturnValue(makeClient({ sites: { select: () => ({ data: null, error: null }) } }));
      expect(await getSite({ userId: "user-1", id: "site-1" })).toBeNull();
    });

    it("returns null for a stranger without access (regression guard)", async () => {
      getServiceClient.mockReturnValue(
        makeClient({ sites: { select: () => ({ data: { id: "site-1", owner_id: "someone-else", project_id: null }, error: null }) } })
      );
      expect(await getSite({ userId: "stranger", id: "site-1" })).toBeNull();
    });

    it("returns the site plus its non-secret key metadata (never key_hash) for the owner", async () => {
      const client = makeClient({
        sites: { select: () => ({ data: { id: "site-1", owner_id: "user-1", project_id: null, name: "Site" }, error: null }) },
        api_keys: {
          select: () => ({ data: [{ id: "k1", key_prefix: "wn_live_a1B2", is_active: true }], error: null }),
        },
      });
      getServiceClient.mockReturnValue(client);

      const result = await getSite({ userId: "user-1", id: "site-1" });
      expect(result.apiKeys).toEqual([{ id: "k1", key_prefix: "wn_live_a1B2", is_active: true }]);
    });
  });

  describe("updateSite", () => {
    it("reports not_found before any validation when the user has no access", async () => {
      getServiceClient.mockReturnValue(makeClient({ sites: { select: () => ({ data: null, error: null }) } }));
      const result = await updateSite({ userId: "stranger", id: "site-1", allowedOrigins: [] });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("rejects clearing all allowed origins for a user who does have access", async () => {
      getServiceClient.mockReturnValue(
        makeClient({ sites: { select: () => ({ data: { id: "site-1", owner_id: "user-1", project_id: null }, error: null }) } })
      );
      const result = await updateSite({ userId: "user-1", id: "site-1", allowedOrigins: [] });
      expect(result).toEqual({ ok: false, error: "at_least_one_origin_required" });
    });
  });

  it("deleteSite checks access before deleting, scoped by id", async () => {
    const client = makeClient({
      sites: { select: () => ({ data: { id: "site-1", owner_id: "user-1", project_id: null }, error: null }) },
    });
    getServiceClient.mockReturnValue(client);

    const result = await deleteSite({ userId: "user-1", id: "site-1" });
    expect(result).toEqual({ ok: true });
    expect(client.__calls.some((c) => c.table === "sites" && c.op === "delete")).toBe(true);
  });

  describe("createApiKey", () => {
    it("reports not_found for a site the user can't access", async () => {
      const client = makeClient({ sites: { select: () => ({ data: null, error: null }) } });
      getServiceClient.mockReturnValue(client);

      const result = await createApiKey({ userId: "user-1", siteId: "site-1", label: "Prod" });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("rejects creating a new key once the active-key cap is reached", async () => {
      const client = makeClient({
        sites: { select: () => ({ data: { id: "site-1", owner_id: "user-1", project_id: null }, error: null }) },
        api_keys: { select: () => ({ count: 5, error: null }) },
      });
      getServiceClient.mockReturnValue(client);

      const result = await createApiKey({ userId: "user-1", siteId: "site-1" });
      expect(result).toEqual({ ok: false, error: "too_many_active_keys" });
      expect(client.__calls.some((c) => c.table === "api_keys" && c.op === "insert")).toBe(false);
    });

    it("creates a new key without touching (or being blocked by) existing ones", async () => {
      const client = makeClient({
        sites: { select: () => ({ data: { id: "site-1", owner_id: "user-1", project_id: null }, error: null }) },
        api_keys: {
          select: () => ({ count: 1, error: null }),
          insert: () => ({ data: null, error: null }),
        },
      });
      getServiceClient.mockReturnValue(client);

      const result = await createApiKey({ userId: "user-1", siteId: "site-1", label: "Production" });

      expect(result.ok).toBe(true);
      expect(result.apiKey.startsWith("wn_live_")).toBe(true);
      const insertCall = client.__calls.find((c) => c.table === "api_keys" && c.op === "insert");
      expect(insertCall.payload.site_id).toBe("site-1");
      expect(insertCall.payload.label).toBe("Production");
      expect(client.__calls.some((c) => c.table === "api_keys" && c.op === "update")).toBe(false);
    });

    it("allows a project member (not just the owner) to manage keys on a shared site", async () => {
      userHasProjectAccess.mockResolvedValue(true);
      const client = makeClient({
        sites: { select: () => ({ data: { id: "site-1", owner_id: "someone-else", project_id: "p1" }, error: null }) },
        api_keys: { select: () => ({ count: 0, error: null }), insert: () => ({ data: null, error: null }) },
      });
      getServiceClient.mockReturnValue(client);

      const result = await createApiKey({ userId: "member-1", siteId: "site-1" });
      expect(result.ok).toBe(true);
    });
  });

  describe("revokeApiKey", () => {
    it("reports not_found for a site the user can't access", async () => {
      const client = makeClient({ sites: { select: () => ({ data: null, error: null }) } });
      getServiceClient.mockReturnValue(client);

      const result = await revokeApiKey({ userId: "user-1", siteId: "site-1", keyId: "key-1" });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("reports not_found when the key does not belong to that site", async () => {
      const client = makeClient({
        sites: { select: () => ({ data: { id: "site-1", owner_id: "user-1", project_id: null }, error: null }) },
        api_keys: { update: () => ({ data: null, error: null }) },
      });
      getServiceClient.mockReturnValue(client);

      const result = await revokeApiKey({ userId: "user-1", siteId: "site-1", keyId: "someone-elses-key" });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("scopes the revoke by both key id and site_id (regression guard against cross-site key revocation)", async () => {
      const capturedEq = [];
      getServiceClient.mockReturnValue({
        from: (table) => {
          if (table === "sites") {
            return {
              select: () => chain({ data: { id: "site-1", owner_id: "user-1", project_id: null }, error: null }),
            };
          }
          const node = {
            eq: (col, val) => {
              capturedEq.push([col, val]);
              return node;
            },
            select: () => node,
            maybeSingle: async () => ({ data: { id: "key-1" }, error: null }),
          };
          return { update: () => node };
        },
      });

      const result = await revokeApiKey({ userId: "user-1", siteId: "site-1", keyId: "key-1" });
      expect(result).toEqual({ ok: true });
      expect(capturedEq).toEqual([["id", "key-1"], ["site_id", "site-1"]]);
    });
  });

  describe("listSites", () => {
    it("with a projectId, scopes by project_id alone (caller has already verified project access)", async () => {
      let capturedFilters = [];
      getServiceClient.mockReturnValue({
        from: () => ({
          select: () => {
            const node = {
              eq: (col, val) => {
                capturedFilters.push([col, val]);
                return node;
              },
              order: () => node,
              then: (resolve) => resolve({ data: [], error: null }),
            };
            return node;
          },
        }),
      });

      await listSites({ userId: "user-1", projectId: "proj-1" });
      expect(capturedFilters).toEqual([["project_id", "proj-1"]]);
    });

    it("without a projectId, falls back to owner_id-scoped listing", async () => {
      let capturedFilters = [];
      getServiceClient.mockReturnValue({
        from: () => ({
          select: () => {
            const node = {
              eq: (col, val) => {
                capturedFilters.push([col, val]);
                return node;
              },
              order: () => node,
              then: (resolve) => resolve({ data: [], error: null }),
            };
            return node;
          },
        }),
      });

      await listSites({ userId: "user-1" });
      expect(capturedFilters).toEqual([["owner_id", "user-1"]]);
    });
  });
});
