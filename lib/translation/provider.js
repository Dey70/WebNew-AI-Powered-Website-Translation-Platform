// The seam future providers (DeepL, OpenAI, etc. -- V3) plug into. One function
// boundary, not a plugin framework.
//
// Uses MyMemory (https://mymemory.translated.net) -- free, no API key required.
// LibreTranslate's public instance (libretranslate.de) stopped serving
// unauthenticated requests (now redirects/rejects POST), and libretranslate.com
// requires a paid portal key, so MyMemory is the working zero-budget option for
// V1. Rate limit: ~5000 words/day per calling IP anonymously (higher with an
// email address via MYMEMORY_EMAIL, per MyMemory's usage policy) -- shared
// across all tenants since requests come from this server's IP.
//
// Never throws for expected failure modes -- always returns a tagged result so
// callers can produce an honest, explicit failure response instead of a
// fabricated "success".
export async function translateText(text, sourceIso, targetIso, providerConfig = {}) {
  const timeoutMs = providerConfig.timeoutMs || 10000;
  const email = providerConfig.email || process.env.MYMEMORY_EMAIL;

  const params = new URLSearchParams({
    q: text,
    langpair: `${sourceIso}|${targetIso}`,
  });
  if (email) params.set("de", email);

  const endpoint = `https://api.mymemory.translated.net/get?${params.toString()}`;

  let response;
  try {
    response = await fetch(endpoint, { signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    if (err.name === "AbortError" || err.name === "TimeoutError") {
      return { ok: false, reason: "provider_timeout", detail: err.message };
    }
    return { ok: false, reason: "provider_error", detail: err.message };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { ok: false, reason: "provider_error", detail: `HTTP ${response.status}: ${detail}` };
  }

  const data = await response.json().catch(() => null);

  // MyMemory often returns HTTP 200 even for quota/error conditions, with the
  // real status embedded in the JSON body.
  if (!data || Number(data.responseStatus) !== 200) {
    const detail = (data && data.responseDetails) || "Unknown MyMemory error";
    return { ok: false, reason: "provider_error", detail };
  }

  if (data.quotaFinished) {
    return { ok: false, reason: "provider_error", detail: "MyMemory daily quota exceeded" };
  }

  const translatedText = data.responseData && data.responseData.translatedText;
  if (!translatedText) {
    return { ok: false, reason: "empty_translation", detail: "Provider returned no translation" };
  }

  return { ok: true, translatedText };
}
