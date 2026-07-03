// The seam future providers (DeepL, OpenAI, etc. -- V3) plug into. One function
// boundary, not a plugin framework: LibreTranslate is the only implementation today.
//
// Never throws for expected failure modes -- always returns a tagged result so
// callers can produce an honest, explicit failure response instead of a fabricated
// "success".
export async function translateText(text, sourceIso, targetIso, providerConfig = {}) {
  const url = providerConfig.url || process.env.LIBRETRANSLATE_URL || "https://libretranslate.de";
  const apiKey = providerConfig.apiKey || process.env.LIBRETRANSLATE_API_KEY;
  const timeoutMs = providerConfig.timeoutMs || 10000;

  const endpoint = `${url.replace(/\/$/, "")}/translate`;
  const payload = { q: text, source: sourceIso, target: targetIso, format: "text" };
  if (apiKey) payload.api_key = apiKey;

  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs),
    });
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
  const translatedText = data && (data.translatedText || data.translation);

  if (!translatedText) {
    return { ok: false, reason: "empty_translation", detail: "Provider returned no translation" };
  }

  return { ok: true, translatedText };
}
