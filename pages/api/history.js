import { resolveSiteFromRequest, AUTH_ERROR_MESSAGES } from "@/lib/auth/apiKeys";
import { saveTranslation, listTranslations, clearTranslations } from "@/lib/history";

const REASON_STATUS = {
  missing_fields: 400,
  missing_api_key: 401,
  invalid_api_key: 401,
  site_inactive: 403,
  origin_not_allowed: 403,
};

function fail(res, reason, message) {
  const status = REASON_STATUS[reason] || 500;
  return res.status(status).json({ success: false, error: reason, message });
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end();
    return;
  }

  const isBodyMethod = req.method === "POST";
  const apiKey = isBodyMethod ? req.body?.api_key : req.query?.api_key;
  const hostname = isBodyMethod ? req.body?.hostname : req.query?.hostname;

  const auth = await resolveSiteFromRequest(req, apiKey, hostname);
  if (!auth.ok) {
    return fail(res, auth.reason, AUTH_ERROR_MESSAGES[auth.reason] || "Authentication failed");
  }

  if (auth.originHeader) {
    res.setHeader("Access-Control-Allow-Origin", auth.originHeader);
    res.setHeader("Vary", "Origin");
  }

  switch (req.method) {
    case "GET": {
      const { page, limit } = req.query;
      const result = await listTranslations({ siteId: auth.siteId, page, limit });
      return res.status(200).json({ success: true, ...result });
    }

    case "POST": {
      const { original_text, translated_text, target_language } = req.body || {};
      if (!original_text || !translated_text || !target_language) {
        return fail(res, "missing_fields", "original_text, translated_text, and target_language are required");
      }
      const result = await saveTranslation({
        siteId: auth.siteId,
        originalText: original_text,
        translatedText: translated_text,
        targetLanguage: target_language,
      });
      return res.status(201).json({
        success: true,
        data: { id: result.id, original_text, translated_text, target_language },
        message: "Translation saved to history",
      });
    }

    case "DELETE": {
      const result = await clearTranslations({ siteId: auth.siteId });
      if (!result.ok) {
        return res.status(500).json({ success: false, error: "internal_error", message: result.error });
      }
      return res.status(200).json({ success: true, message: "All translation history cleared" });
    }

    default:
      return res.status(405).json({
        success: false,
        error: "method_not_allowed",
        message: `Method ${req.method} is not supported`,
      });
  }
}
