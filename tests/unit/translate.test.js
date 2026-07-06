import { describe, it, expect, vi, beforeEach } from "vitest";
import httpMocks from "node-mocks-http";

vi.mock("@/lib/auth/apiKeys", () => ({
  resolveSiteFromRequest: vi.fn(),
  AUTH_ERROR_MESSAGES: {
    missing_api_key: "An API key is required",
    invalid_api_key: "The provided API key is invalid",
    site_inactive: "This site is no longer active",
    origin_not_allowed: "This API key is not authorized for the requesting origin",
  },
}));
vi.mock("@/lib/translation/provider", () => ({
  translateText: vi.fn(),
}));
vi.mock("@/lib/history", () => ({
  saveTranslation: vi.fn(),
}));
vi.mock("@/lib/rateLimit", () => ({
  checkRateLimit: vi.fn(),
}));

import { resolveSiteFromRequest } from "@/lib/auth/apiKeys";
import { translateText } from "@/lib/translation/provider";
import { saveTranslation } from "@/lib/history";
import { checkRateLimit } from "@/lib/rateLimit";
import handler from "../../pages/api/translate.js";

function makeReqRes(body, headers = {}) {
  const req = httpMocks.createRequest({
    method: "POST",
    body,
    headers: { origin: "https://example.com", ...headers },
  });
  const res = httpMocks.createResponse();
  return { req, res };
}

describe("pages/api/translate", () => {
  beforeEach(() => {
    resolveSiteFromRequest.mockReset();
    translateText.mockReset();
    saveTranslation.mockReset();
    checkRateLimit.mockReset();
    saveTranslation.mockResolvedValue({ saved: true, id: "hist-1" });
    checkRateLimit.mockResolvedValue({ allowed: true, remaining: 59, reset: null });
  });

  it("returns 400 when text/targetLanguage are missing", async () => {
    const { req, res } = makeReqRes({ text: "hello" });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData()).toMatchObject({ success: false, error: "missing_fields" });
  });

  it("returns 400 for text over 1000 characters", async () => {
    const { req, res } = makeReqRes({ text: "a".repeat(1001), targetLanguage: "french" });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().error).toBe("text_too_long");
  });

  it("returns 400 for an unsupported target language", async () => {
    const { req, res } = makeReqRes({ text: "hello", targetLanguage: "klingon" });
    await handler(req, res);
    expect(res.statusCode).toBe(400);
    expect(res._getJSONData().error).toBe("invalid_language");
  });

  it("returns 401 when the api key is missing/invalid", async () => {
    resolveSiteFromRequest.mockResolvedValue({ ok: false, reason: "invalid_api_key" });
    const { req, res } = makeReqRes({ text: "hello", targetLanguage: "french", api_key: "bad" });
    await handler(req, res);
    expect(res.statusCode).toBe(401);
    expect(res._getJSONData().error).toBe("invalid_api_key");
    expect(translateText).not.toHaveBeenCalled();
  });

  it("returns 403 when the origin is not allowed", async () => {
    resolveSiteFromRequest.mockResolvedValue({ ok: false, reason: "origin_not_allowed" });
    const { req, res } = makeReqRes({ text: "hello", targetLanguage: "french", api_key: "wn_live_x" });
    await handler(req, res);
    expect(res.statusCode).toBe(403);
    expect(res._getJSONData().error).toBe("origin_not_allowed");
  });

  it("returns 429 with Retry-After when the site is rate-limited", async () => {
    resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
    checkRateLimit.mockResolvedValue({ allowed: false, remaining: 0, reset: Date.now() + 5000 });
    const { req, res } = makeReqRes({ text: "hello", targetLanguage: "french", api_key: "wn_live_x" });
    await handler(req, res);
    expect(res.statusCode).toBe(429);
    expect(res._getJSONData().error).toBe("rate_limited");
    expect(res.getHeader("Retry-After")).toBeTruthy();
    expect(translateText).not.toHaveBeenCalled();
  });

  it("returns an explicit 502 on provider failure and NEVER fabricates a translation", async () => {
    resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
    translateText.mockResolvedValue({ ok: false, reason: "provider_error", detail: "boom" });
    const { req, res } = makeReqRes({ text: "hello", targetLanguage: "french", api_key: "wn_live_x" });
    await handler(req, res);
    expect(res.statusCode).toBe(502);
    const body = res._getJSONData();
    expect(body.success).toBe(false);
    expect(body.error).toBe("provider_error");
    // Regression guard: this exact substring was the old fake-fallback behavior.
    expect(JSON.stringify(body)).not.toContain("[Translated to");
    expect(saveTranslation).not.toHaveBeenCalled();
  });

  it("returns 502 on provider timeout", async () => {
    resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
    translateText.mockResolvedValue({ ok: false, reason: "provider_timeout", detail: "timed out" });
    const { req, res } = makeReqRes({ text: "hello", targetLanguage: "french", api_key: "wn_live_x" });
    await handler(req, res);
    expect(res.statusCode).toBe(502);
    expect(res._getJSONData().error).toBe("provider_timeout");
  });

  it("returns 502 when the provider returns an empty translation", async () => {
    resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
    translateText.mockResolvedValue({ ok: false, reason: "empty_translation", detail: "" });
    const { req, res } = makeReqRes({ text: "hello", targetLanguage: "french", api_key: "wn_live_x" });
    await handler(req, res);
    expect(res.statusCode).toBe(502);
    expect(res._getJSONData().error).toBe("empty_translation");
  });

  it("succeeds with a valid key, origin, and provider response, and logs history without waiting for it", async () => {
    resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
    translateText.mockResolvedValue({ ok: true, translatedText: "Bonjour" });
    const { req, res } = makeReqRes({ text: "hello", targetLanguage: "french", api_key: "wn_live_x" });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    const body = res._getJSONData();
    expect(body.success).toBe(true);
    expect(body.data.translatedText).toBe("Bonjour");
    expect(body.data.saved).toBeUndefined(); // fire-and-forget: not part of the synchronous response
    expect(saveTranslation).toHaveBeenCalledWith(expect.objectContaining({ siteId: "site-1" }));
  });

  it("still responds success:true (without waiting) when the history save rejects (DB failure is not a translation failure)", async () => {
    resolveSiteFromRequest.mockResolvedValue({ ok: true, siteId: "site-1" });
    translateText.mockResolvedValue({ ok: true, translatedText: "Bonjour" });
    saveTranslation.mockRejectedValue(new Error("db unreachable"));
    const { req, res } = makeReqRes({ text: "hello", targetLanguage: "french", api_key: "wn_live_x" });
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData().success).toBe(true);
  });

  describe("OPTIONS preflight", () => {
    // Regression guard: a cross-origin browser fetch() sends a CORS preflight
    // (OPTIONS) before the real POST. Without Access-Control-Allow-Origin on
    // THIS response, the browser blocks the POST before it's ever sent --
    // the actual origin/API-key check inside the POST handler never even
    // gets a chance to run. This is what "fetch failed" on a real embedded
    // widget looks like; curl and same-origin testing never catch it.
    it("echoes the request's Origin header so the browser's preflight succeeds", async () => {
      const req = httpMocks.createRequest({
        method: "OPTIONS",
        headers: { origin: "https://customer-site.com" },
      });
      const res = httpMocks.createResponse();
      await handler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.getHeader("Access-Control-Allow-Origin")).toBe("https://customer-site.com");
    });

    it("does not set Access-Control-Allow-Origin when there is no Origin header", async () => {
      const req = httpMocks.createRequest({ method: "OPTIONS", headers: {} });
      const res = httpMocks.createResponse();
      await handler(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.getHeader("Access-Control-Allow-Origin")).toBeUndefined();
    });
  });
});
