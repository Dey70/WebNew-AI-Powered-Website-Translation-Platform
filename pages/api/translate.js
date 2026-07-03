import { resolveSiteFromRequest, AUTH_ERROR_MESSAGES } from "@/lib/auth/apiKeys";
import { translateText } from "@/lib/translation/provider";
import { normalizeLang, isSupportedTarget, validInternalLanguages } from "@/lib/translation/languages";
import { saveTranslation } from "@/lib/history";
import { checkRateLimit } from "@/lib/rateLimit";

const REASON_STATUS = {
  missing_fields: 400,
  invalid_text: 400,
  text_too_long: 400,
  invalid_language: 400,
  missing_api_key: 401,
  invalid_api_key: 401,
  site_inactive: 403,
  origin_not_allowed: 403,
  rate_limited: 429,
  provider_timeout: 502,
  provider_error: 502,
  empty_translation: 502,
};

function fail(res, reason, message) {
  const status = REASON_STATUS[reason] || 500;
  return res.status(status).json({ success: false, error: reason, message });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "method_not_allowed",
      message: "Only POST requests are supported",
    });
  }

  const { text, sourceLanguage, targetLanguage, language, api_key, hostname } = req.body || {};
  const requestedTarget = targetLanguage || language;
  const requestedSource = sourceLanguage || "en";

  if (!text || !requestedTarget) {
    return fail(res, "missing_fields", "text and targetLanguage are required");
  }
  if (typeof text !== "string" || text.trim().length === 0) {
    return fail(res, "invalid_text", "Text must be a non-empty string");
  }
  if (text.length > 1000) {
    return fail(res, "text_too_long", "Text must be less than 1000 characters");
  }

  const normalizedTarget = normalizeLang(requestedTarget, "french");
  const normalizedSource = normalizeLang(requestedSource, "en");

  if (!isSupportedTarget(normalizedTarget)) {
    return fail(res, "invalid_language", `Target language must be one of: ${validInternalLanguages.join(", ")}`);
  }

  const auth = await resolveSiteFromRequest(req, api_key, hostname);
  if (!auth.ok) {
    return fail(res, auth.reason, AUTH_ERROR_MESSAGES[auth.reason] || "Authentication failed");
  }

  if (auth.originHeader) {
    res.setHeader("Access-Control-Allow-Origin", auth.originHeader);
    res.setHeader("Vary", "Origin");
  }

  const rateLimit = await checkRateLimit(auth.siteId);
  if (!rateLimit.allowed) {
    if (rateLimit.reset) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.reset - Date.now()) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
    }
    return fail(res, "rate_limited", "Too many requests. Please slow down.");
  }

  const startedAt = Date.now();
  const providerResult = await translateText(text, normalizedSource.iso, normalizedTarget.iso);

  if (!providerResult.ok) {
    const messages = {
      provider_timeout: "Translation service timed out. Please try again shortly.",
      provider_error: "Translation service is temporarily unavailable. Please try again shortly.",
      empty_translation: "Translation service returned an empty result. Please try again shortly.",
    };
    return fail(res, providerResult.reason, messages[providerResult.reason]);
  }

  const processingTime = Date.now() - startedAt;
  const targetInternalKey = normalizedTarget.internal;
  const characterCount = text.length;
  const wordCount = text.trim().split(/\s+/).length;

  const saveResult = await saveTranslation({
    siteId: auth.siteId,
    originalText: text,
    translatedText: providerResult.translatedText,
    targetLanguage: targetInternalKey,
    characterCount,
    wordCount,
  });

  res.status(200).json({
    success: true,
    data: {
      originalText: text,
      translatedText: providerResult.translatedText,
      targetLanguage: targetInternalKey,
      processingTime,
      characterCount,
      wordCount,
      saved: saveResult.saved,
      id: saveResult.id,
    },
    message: "Translation completed successfully",
  });
}
