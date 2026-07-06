import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  getServiceClient: vi.fn(),
}));
vi.mock("@/lib/projects", () => ({
  getProject: vi.fn(),
}));

import { getServiceClient } from "@/lib/supabase/admin";
import { getProject } from "@/lib/projects";
import {
  createSite,
  listSites,
  getSite,
  updateSite,
  deleteSite,
  createApiKey,
  revokeApiKey,
} from "@/lib/sites";

// Minimal chainable fake, keyed per table, matching lib/sites.js's exact call shapes:
// .insert().select().single() / .select().eq()...maybeSingle()-or-thenable / .update().eq().eq().select().maybeSingle() / .delete().eq()...
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
    getProject.mockReset();
  });

  describe("createSite", () => {
    it("requires at least one allowed origin", async () => {
      const client = makeClient({});
      getServiceClient.mockReturnValue(client);

      const result = await createSite({ ownerId: "user-1", ownerEmail: "a@b.com", name: "Site", allowedOrigins: [] });

      expect(result).toEqual({ ok: false, error: "at_least_one_origin_required" });
      expect(client.__calls).toHaveLength(0);
    });

    it("rejects a projectId that does not belong to the owner", async () => {
      getProject.mockResolvedValue(null);
      const client = makeClient({});
      getServiceClient.mockReturnValue(client);

      const result = await createSite({
        ownerId: "user-1",
        ownerEmail: "a@b.com",
        projectId: "someone-elses-project",
        name: "Site",
        allowedOrigins: ["example.com"],
      });

      expect(result).toEqual({ ok: false, error: "project_not_found" });
      expect(client.__calls).toHaveLength(0);
    });

    it("creates the site scoped to the owner, normalizes origins, and issues an API key", async () => {
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
        ownerId: "user-1",
        ownerEmail: "a@b.com",
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
        ownerId: "user-1",
        ownerEmail: "a@b.com",
        name: "Site",
        allowedOrigins: ["example.com"],
      });

      expect(result.ok).toBe(false);
      const rollbackDelete = client.__calls.find((c) => c.table === "sites" && c.op === "delete");
      expect(rollbackDelete).toBeTruthy();
    });
  });

  it("getSite returns null when no row matches the owner", async () => {
    const client = makeClient({ sites: { select: () => ({ data: null, error: null }) } });
    getServiceClient.mockReturnValue(client);

    const result = await getSite({ ownerId: "user-1", id: "site-1" });
    expect(result).toBeNull();
  });

  it("getSite returns the site plus its non-secret key metadata (never key_hash)", async () => {
    const client = makeClient({
      sites: { select: () => ({ data: { id: "site-1", name: "Site" }, error: null }) },
      api_keys: {
        select: () => ({
          data: [{ id: "k1", key_prefix: "wn_live_a1B2", is_active: true }],
          error: null,
        }),
      },
    });
    getServiceClient.mockReturnValue(client);

    const result = await getSite({ ownerId: "user-1", id: "site-1" });
    expect(result.apiKeys).toEqual([{ id: "k1", key_prefix: "wn_live_a1B2", is_active: true }]);
  });

  it("updateSite rejects clearing all allowed origins", async () => {
    const client = makeClient({});
    getServiceClient.mockReturnValue(client);

    const result = await updateSite({ ownerId: "user-1", id: "site-1", allowedOrigins: [] });
    expect(result).toEqual({ ok: false, error: "at_least_one_origin_required" });
  });

  it("updateSite reports not_found when no row matches the owner", async () => {
    const client = makeClient({ sites: { update: () => ({ data: null, error: null }) } });
    getServiceClient.mockReturnValue(client);

    const result = await updateSite({ ownerId: "user-1", id: "site-1", isActive: false });
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("deleteSite scopes the delete by both id and owner_id", async () => {
    const client = makeClient({ sites: { delete: () => ({ error: null }) } });
    getServiceClient.mockReturnValue(client);

    const result = await deleteSite({ ownerId: "user-1", id: "site-1" });
    expect(result).toEqual({ ok: true });
  });

  describe("createApiKey", () => {
    it("reports not_found for a site that does not belong to the owner", async () => {
      const client = makeClient({ sites: { select: () => ({ data: null, error: null }) } });
      getServiceClient.mockReturnValue(client);

      const result = await createApiKey({ ownerId: "user-1", siteId: "site-1", label: "Prod" });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("rejects creating a new key once the active-key cap is reached", async () => {
      const client = makeClient({
        sites: { select: () => ({ data: { id: "site-1" }, error: null }) },
        api_keys: { select: () => ({ count: 5, error: null }) },
      });
      getServiceClient.mockReturnValue(client);

      const result = await createApiKey({ ownerId: "user-1", siteId: "site-1" });
      expect(result).toEqual({ ok: false, error: "too_many_active_keys" });
      expect(client.__calls.some((c) => c.table === "api_keys" && c.op === "insert")).toBe(false);
    });

    it("creates a new key without touching (or being blocked by) existing ones", async () => {
      const client = makeClient({
        sites: { select: () => ({ data: { id: "site-1" }, error: null }) },
        api_keys: {
          select: () => ({ count: 1, error: null }),
          insert: () => ({ data: null, error: null }),
        },
      });
      getServiceClient.mockReturnValue(client);

      const result = await createApiKey({ ownerId: "user-1", siteId: "site-1", label: "Production" });

      expect(result.ok).toBe(true);
      expect(result.apiKey.startsWith("wn_live_")).toBe(true);
      const insertCall = client.__calls.find((c) => c.table === "api_keys" && c.op === "insert");
      expect(insertCall.payload.site_id).toBe("site-1");
      expect(insertCall.payload.label).toBe("Production");
      expect(client.__calls.some((c) => c.table === "api_keys" && c.op === "update")).toBe(false);
    });
  });

  describe("revokeApiKey", () => {
    it("reports not_found for a site that does not belong to the owner", async () => {
      const client = makeClient({ sites: { select: () => ({ data: null, error: null }) } });
      getServiceClient.mockReturnValue(client);

      const result = await revokeApiKey({ ownerId: "user-1", siteId: "site-1", keyId: "key-1" });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("reports not_found when the key does not belong to that site", async () => {
      const client = makeClient({
        sites: { select: () => ({ data: { id: "site-1" }, error: null }) },
        api_keys: { update: () => ({ data: null, error: null }) },
      });
      getServiceClient.mockReturnValue(client);

      const result = await revokeApiKey({ ownerId: "user-1", siteId: "site-1", keyId: "someone-elses-key" });
      expect(result).toEqual({ ok: false, error: "not_found" });
    });

    it("scopes the revoke by both key id and site_id (regression guard against cross-site key revocation)", async () => {
      const capturedEq = [];
      getServiceClient.mockReturnValue({
        from: (table) => {
          if (table === "sites") {
            return {
              select: () => ({
                eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { id: "site-1" }, error: null }) }) }),
              }),
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

      const result = await revokeApiKey({ ownerId: "user-1", siteId: "site-1", keyId: "key-1" });
      expect(result).toEqual({ ok: true });
      expect(capturedEq).toEqual([["id", "key-1"], ["site_id", "site-1"]]);
    });
  });

  it("listSites scopes by owner_id and optionally filters by project_id", async () => {
    const client = makeClient({ sites: { select: () => ({ data: [], error: null }) } });
    getServiceClient.mockReturnValue(client);

    const result = await listSites({ ownerId: "user-1", projectId: "proj-1" });
    expect(result).toEqual([]);
  });
});
