import { describe, it, expect, vi, beforeEach } from "vitest";

const TEST_PEPPER = "test-pepper-value";
process.env.API_KEY_PEPPER = TEST_PEPPER;

// Minimal fake Supabase query builder supporting the chains apiKeys.js uses:
// .from(table).select(...).eq(col, val).maybeSingle()
// .from(table).update(...).eq(col, val) -> thenable
function makeFakeSupabase({ apiKeyRow, siteRow }) {
  const calls = { updateEq: [] };

  function selectBuilder(table) {
    return {
      select: () => ({
        eq: (col, val) => ({
          maybeSingle: async () => {
            if (table === "api_keys") {
              return { data: apiKeyRow ?? null, error: null };
            }
            if (table === "sites") {
              return { data: siteRow ?? null, error: null };
            }
            return { data: null, error: null };
          },
        }),
      }),
      update: (patch) => ({
        eq: (col, val) => {
          calls.updateEq.push({ table, col, val, patch });
          return Promise.resolve({ data: null, error: null });
        },
      }),
    };
  }

  return {
    from: (table) => selectBuilder(table),
    __calls: calls,
  };
}

vi.mock("@/lib/supabase/admin", () => ({
  getServiceClient: vi.fn(),
}));

import { getServiceClient } from "@/lib/supabase/admin";
import {
  generateApiKey,
  hashApiKey,
  timingSafeEqualHex,
  resolveSiteFromApiKey,
} from "@/lib/auth/apiKeys";

describe("generateApiKey", () => {
  it("produces a wn_live_-prefixed key with a matching prefix field", () => {
    const { raw, prefix } = generateApiKey();
    expect(raw.startsWith("wn_live_")).toBe(true);
    expect(raw.startsWith(prefix)).toBe(true);
    expect(prefix.length).toBe(12);
  });

  it("produces different keys on each call", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.raw).not.toBe(b.raw);
  });
});

describe("hashApiKey", () => {
  it("is deterministic for the same input and pepper", () => {
    expect(hashApiKey("wn_live_abc")).toBe(hashApiKey("wn_live_abc"));
  });

  it("changes when the pepper changes", () => {
    const original = hashApiKey("wn_live_abc");
    process.env.API_KEY_PEPPER = "different-pepper";
    const changed = hashApiKey("wn_live_abc");
    process.env.API_KEY_PEPPER = TEST_PEPPER;
    expect(changed).not.toBe(original);
  });

  it("is a 64-char hex digest", () => {
    expect(hashApiKey("wn_live_abc")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("timingSafeEqualHex", () => {
  it("returns true for identical hex strings", () => {
    const h = hashApiKey("wn_live_abc");
    expect(timingSafeEqualHex(h, h)).toBe(true);
  });

  it("returns false for different hex strings of the same length", () => {
    const h1 = hashApiKey("wn_live_abc");
    const h2 = hashApiKey("wn_live_xyz");
    expect(timingSafeEqualHex(h1, h2)).toBe(false);
  });

  it("does not throw on mismatched lengths, just returns false", () => {
    expect(() => timingSafeEqualHex("abc", "abcdef")).not.toThrow();
    expect(timingSafeEqualHex("abc", "abcdef")).toBe(false);
  });

  it("returns false for non-string input", () => {
    expect(timingSafeEqualHex(null, undefined)).toBe(false);
  });
});

describe("resolveSiteFromApiKey", () => {
  const rawKey = "wn_live_" + "a".repeat(32);
  const validHash = hashApiKey(rawKey);

  beforeEach(() => {
    getServiceClient.mockReset();
  });

  it("rejects a missing key", async () => {
    const result = await resolveSiteFromApiKey(null, "example.com");
    expect(result).toEqual({ ok: false, reason: "missing_api_key" });
  });

  it("rejects when Supabase is not configured", async () => {
    getServiceClient.mockReturnValue(null);
    const result = await resolveSiteFromApiKey(rawKey, "example.com");
    expect(result).toEqual({ ok: false, reason: "invalid_api_key" });
  });

  it("rejects an unknown key prefix", async () => {
    getServiceClient.mockReturnValue(makeFakeSupabase({ apiKeyRow: null }));
    const result = await resolveSiteFromApiKey(rawKey, "example.com");
    expect(result).toEqual({ ok: false, reason: "invalid_api_key" });
  });

  it("rejects a key whose hash does not match", async () => {
    getServiceClient.mockReturnValue(
      makeFakeSupabase({
        apiKeyRow: { id: "k1", site_id: "s1", key_hash: "0".repeat(64), is_active: true, revoked_at: null },
      })
    );
    const result = await resolveSiteFromApiKey(rawKey, "example.com");
    expect(result).toEqual({ ok: false, reason: "invalid_api_key" });
  });

  it("rejects a revoked/inactive key", async () => {
    getServiceClient.mockReturnValue(
      makeFakeSupabase({
        apiKeyRow: { id: "k1", site_id: "s1", key_hash: validHash, is_active: false, revoked_at: null },
      })
    );
    const result = await resolveSiteFromApiKey(rawKey, "example.com");
    expect(result).toEqual({ ok: false, reason: "invalid_api_key" });
  });

  it("rejects when the site is inactive", async () => {
    getServiceClient.mockReturnValue(
      makeFakeSupabase({
        apiKeyRow: { id: "k1", site_id: "s1", key_hash: validHash, is_active: true, revoked_at: null },
        siteRow: { id: "s1", is_active: false, allowed_origins: ["example.com"] },
      })
    );
    const result = await resolveSiteFromApiKey(rawKey, "example.com");
    expect(result).toEqual({ ok: false, reason: "site_inactive" });
  });

  it("rejects a hostname not in allowed_origins", async () => {
    getServiceClient.mockReturnValue(
      makeFakeSupabase({
        apiKeyRow: { id: "k1", site_id: "s1", key_hash: validHash, is_active: true, revoked_at: null },
        siteRow: { id: "s1", is_active: true, allowed_origins: ["example.com"] },
      })
    );
    const result = await resolveSiteFromApiKey(rawKey, "evil.com");
    expect(result).toEqual({ ok: false, reason: "origin_not_allowed" });
  });

  it("treats www. as equivalent to the bare domain", async () => {
    getServiceClient.mockReturnValue(
      makeFakeSupabase({
        apiKeyRow: { id: "k1", site_id: "s1", key_hash: validHash, is_active: true, revoked_at: null },
        siteRow: { id: "s1", is_active: true, allowed_origins: ["example.com"] },
      })
    );
    const result = await resolveSiteFromApiKey(rawKey, "www.example.com");
    expect(result).toEqual({ ok: true, siteId: "s1" });
  });

  it("succeeds for a valid key, active site, and allowed origin", async () => {
    getServiceClient.mockReturnValue(
      makeFakeSupabase({
        apiKeyRow: { id: "k1", site_id: "s1", key_hash: validHash, is_active: true, revoked_at: null },
        siteRow: { id: "s1", is_active: true, allowed_origins: ["example.com"] },
      })
    );
    const result = await resolveSiteFromApiKey(rawKey, "example.com");
    expect(result).toEqual({ ok: true, siteId: "s1" });
  });
});
