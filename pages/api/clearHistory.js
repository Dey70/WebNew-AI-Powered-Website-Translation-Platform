import { resolveSiteFromRequest, AUTH_ERROR_MESSAGES } from "@/lib/auth/apiKeys";
import { clearTranslations } from "@/lib/history";

const REASON_STATUS = {
  missing_api_key: 401,
  invalid_api_key: 401,
  site_inactive: 403,
  origin_not_allowed: 403,
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end();
    return;
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({
      error: "method_not_allowed",
      message: "Only DELETE requests are supported",
    });
  }

  const auth = await resolveSiteFromRequest(req, req.query?.api_key, req.query?.hostname);
  if (!auth.ok) {
    const status = REASON_STATUS[auth.reason] || 500;
    return res.status(status).json({
      success: false,
      error: auth.reason,
      message: AUTH_ERROR_MESSAGES[auth.reason] || "Authentication failed",
    });
  }

  if (auth.originHeader) {
    res.setHeader("Access-Control-Allow-Origin", auth.originHeader);
    res.setHeader("Vary", "Origin");
  }

  const result = await clearTranslations({ siteId: auth.siteId });
  if (!result.ok) {
    return res.status(500).json({
      success: false,
      error: "internal_error",
      message: "An error occurred while clearing translation history",
    });
  }

  res.status(200).json({ success: true, data: null, message: "All translation history cleared" });
}
