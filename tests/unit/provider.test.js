import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { translateText } from "@/lib/translation/provider";

describe("translateText (MyMemory provider)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("requests the correct MyMemory endpoint with source|target langpair", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        responseStatus: 200,
        responseData: { translatedText: "Bonjour" },
      }),
    });

    await translateText("Hello", "en", "fr");

    const calledUrl = global.fetch.mock.calls[0][0];
    expect(calledUrl).toContain("api.mymemory.translated.net/get");
    expect(calledUrl).toContain("langpair=en%7Cfr");
    expect(calledUrl).toContain("q=Hello");
  });

  it("returns ok:true with the translated text on success", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        responseStatus: 200,
        responseData: { translatedText: "Bonjour" },
      }),
    });

    const result = await translateText("Hello", "en", "fr");
    expect(result).toEqual({ ok: true, translatedText: "Bonjour" });
  });

  it("returns an explicit failure when responseStatus is not 200 (e.g. quota exceeded)", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        responseStatus: 403,
        responseDetails: "MYMEMORY WARNING: DAILY QUOTA EXCEEDED",
      }),
    });

    const result = await translateText("Hello", "en", "fr");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("provider_error");
  });

  it("returns an explicit failure when quotaFinished is true", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        responseStatus: 200,
        quotaFinished: true,
        responseData: { translatedText: "Bonjour" },
      }),
    });

    const result = await translateText("Hello", "en", "fr");
    expect(result.ok).toBe(false);
  });

  it("returns empty_translation when no translatedText is present", async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ responseStatus: 200, responseData: {} }),
    });

    const result = await translateText("Hello", "en", "fr");
    expect(result).toEqual({
      ok: false,
      reason: "empty_translation",
      detail: "Provider returned no translation",
    });
  });

  it("returns provider_error on a non-OK HTTP response", async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 500, text: async () => "boom" });
    const result = await translateText("Hello", "en", "fr");
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("provider_error");
  });

  it("returns provider_timeout when the request aborts", async () => {
    const abortError = new Error("aborted");
    abortError.name = "AbortError";
    global.fetch.mockRejectedValue(abortError);
    const result = await translateText("Hello", "en", "fr");
    expect(result).toEqual({ ok: false, reason: "provider_timeout", detail: "aborted" });
  });
});
