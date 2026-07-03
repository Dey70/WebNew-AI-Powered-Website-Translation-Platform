import { describe, it, expect, vi, beforeEach } from "vitest";

const limitMock = vi.fn();

vi.mock("@upstash/redis", () => ({
  Redis: { fromEnv: vi.fn(() => ({})) },
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: Object.assign(
    vi.fn().mockImplementation(() => ({ limit: limitMock })),
    { slidingWindow: vi.fn(() => "sliding-window-config") }
  ),
}));

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.resetModules();
    limitMock.mockReset();
  });

  it("skips rate limiting entirely when Upstash env vars are not configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const result = await checkRateLimit("site-1");
    expect(result).toEqual({ allowed: true, remaining: null, reset: null });
    expect(limitMock).not.toHaveBeenCalled();
  });

  it("keys the limiter per site_id, not per IP", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    limitMock.mockResolvedValue({ success: true, remaining: 59, reset: Date.now() + 10000 });
    const { checkRateLimit } = await import("@/lib/rateLimit");
    await checkRateLimit("site-abc");
    expect(limitMock).toHaveBeenCalledWith("site-abc");
  });

  it("returns allowed:false with reset info when the limit is exceeded", async () => {
    process.env.UPSTASH_REDIS_REST_URL = "https://fake.upstash.io";
    process.env.UPSTASH_REDIS_REST_TOKEN = "fake-token";
    const reset = Date.now() + 5000;
    limitMock.mockResolvedValue({ success: false, remaining: 0, reset });
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const result = await checkRateLimit("site-abc");
    expect(result.allowed).toBe(false);
    expect(result.reset).toBe(reset);
  });
});
