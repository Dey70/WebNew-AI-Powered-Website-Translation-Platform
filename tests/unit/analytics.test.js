import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  getServiceClient: vi.fn(),
}));
vi.mock("@/lib/history", () => ({
  listTranslations: vi.fn(),
}));

import { getServiceClient } from "@/lib/supabase/admin";
import { listTranslations } from "@/lib/history";
import { getSiteAnalytics } from "@/lib/analytics";

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

describe("lib/analytics.js getSiteAnalytics", () => {
  beforeEach(() => {
    getServiceClient.mockReset();
    listTranslations.mockReset();
    listTranslations.mockResolvedValue({ data: [] });
  });

  it("scopes both queries by site_id", () => {
    const capturedEq = [];
    getServiceClient.mockReturnValue({
      from: () => ({
        select: () => {
          const node = {
            eq: (col, val) => {
              capturedEq.push([col, val]);
              return node;
            },
            gte: () => node,
            then: (resolve) => resolve({ data: [], error: null, count: 0 }),
          };
          return node;
        },
      }),
    });

    return getSiteAnalytics({ siteId: "site-1", days: 7 }).then(() => {
      expect(capturedEq.every(([col, val]) => col === "site_id" && val === "site-1")).toBe(true);
      expect(capturedEq.length).toBe(2); // total-count query + windowed-rows query
    });
  });

  it("zero-fills every day in the window, including days with no translations", async () => {
    getServiceClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({ then: (resolve) => resolve({ data: [], error: null }) }),
            then: (resolve) => resolve({ count: 0, error: null }),
          }),
        }),
      }),
    });

    const result = await getSiteAnalytics({ siteId: "site-1", days: 5 });
    expect(result.dailyCounts).toHaveLength(5);
    expect(result.dailyCounts.every((d) => d.count === 0)).toBe(true);
  });

  it("aggregates rows into per-day and per-language counts", async () => {
    const rows = [
      { created_at: isoDaysAgo(0), target_language: "french" },
      { created_at: isoDaysAgo(0), target_language: "french" },
      { created_at: isoDaysAgo(0), target_language: "spanish" },
      { created_at: isoDaysAgo(1), target_language: "french" },
    ];

    getServiceClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({ then: (resolve) => resolve({ data: rows, error: null }) }),
            then: (resolve) => resolve({ count: 42, error: null }),
          }),
        }),
      }),
    });

    const result = await getSiteAnalytics({ siteId: "site-1", days: 7 });

    expect(result.totalCount).toBe(42);
    expect(result.languageCounts).toEqual([
      { language: "french", count: 3 },
      { language: "spanish", count: 1 },
    ]);
    const todayCount = result.dailyCounts[result.dailyCounts.length - 1].count;
    expect(todayCount).toBe(3);
  });

  it("falls back to zeroed/empty results when Supabase isn't configured", async () => {
    getServiceClient.mockReturnValue(null);
    const result = await getSiteAnalytics({ siteId: "site-1" });
    expect(result).toEqual({ totalCount: 0, dailyCounts: [], languageCounts: [], recent: [] });
  });

  it("reuses lib/history.js's listTranslations for recent activity instead of a duplicate query", async () => {
    listTranslations.mockResolvedValue({ data: [{ id: "row-1" }] });
    getServiceClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            gte: () => ({ then: (resolve) => resolve({ data: [], error: null }) }),
            then: (resolve) => resolve({ count: 0, error: null }),
          }),
        }),
      }),
    });

    const result = await getSiteAnalytics({ siteId: "site-1" });
    expect(listTranslations).toHaveBeenCalledWith(expect.objectContaining({ siteId: "site-1" }));
    expect(result.recent).toEqual([{ id: "row-1" }]);
  });
});
