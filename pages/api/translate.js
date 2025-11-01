export default async function handler(req, res) {
  // Set CORS headers for cross-origin requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed",
      message: "Only POST requests are supported",
    });
  }

  try {
    const { text, sourceLanguage, targetLanguage, language } = req.body || {};

    // Accept legacy { language } (Week 11) while preferring { targetLanguage }
    const requestedTarget = targetLanguage || language;
    const requestedSource = sourceLanguage || "en";

    // Enhanced input validation
    if (!text || !requestedTarget) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        message: "text and targetLanguage are required",
      });
    }

    if (typeof text !== "string" || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid text",
        message: "Text must be a non-empty string",
      });
    }

    if (text.length > 1000) {
      return res.status(400).json({
        success: false,
        error: "Text too long",
        message: "Text must be less than 1000 characters",
      });
    }

    // Internal language keys used by the UI
    const internalToIso = {
      french: "fr",
      spanish: "es",
      german: "de",
      italian: "it",
      portuguese: "pt",
      dutch: "nl",
      russian: "ru",
      chinese: "zh",
      japanese: "ja",
      korean: "ko",
    };

    const isoToInternal = Object.fromEntries(
      Object.entries(internalToIso).map(([k, v]) => [v, k])
    );

    // Accept both internal keys (e.g. "french") and ISO codes (e.g. "fr")
    const normalizeLang = (val, fallbackInternal) => {
      if (!val) return { iso: "en", internal: fallbackInternal };
      const lower = String(val).toLowerCase();
      if (internalToIso[lower])
        return { iso: internalToIso[lower], internal: lower };
      // If it's an ISO code we know
      if (isoToInternal[lower])
        return { iso: lower, internal: isoToInternal[lower] };
      // Default: assume already ISO; keep internal as provided
      return { iso: lower, internal: lower };
    };

    const normalizedTarget = normalizeLang(requestedTarget, "french");
    const normalizedSource = normalizeLang(requestedSource, "en");

    // Validate target is among supported UI languages when using internal keys
    const validInternal = [
      "french",
      "spanish",
      "german",
      "italian",
      "portuguese",
      "dutch",
      "russian",
      "chinese",
      "japanese",
      "korean",
    ];

    if (
      normalizedTarget.internal &&
      validInternal.includes(normalizedTarget.internal) === false &&
      isoToInternal[normalizedTarget.iso] === undefined
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid language",
        message: `Target language must be one of: ${validInternal.join(", ")}`,
      });
    }

    // Call LibreTranslate
    const libreUrl =
      process.env.LIBRETRANSLATE_URL || "https://libretranslate.de";
    const libreKey = process.env.LIBRETRANSLATE_API_KEY;

    const startedAt = Date.now();
    let translatedText = "";
    let usedFallback = false;

    try {
      // Build the correct LibreTranslate endpoint - CRITICAL FIX
      const translateEndpoint = `${libreUrl.replace(/\/$/, "")}/translate`;

      const payload = {
        q: text,
        source: normalizedSource.iso,
        target: normalizedTarget.iso,
        format: "text",
      };

      // Only add API key if it exists
      if (libreKey) {
        payload.api_key = libreKey;
      }

      console.log("[Translate] Calling LibreTranslate:", translateEndpoint);
      console.log("[Translate] Payload:", JSON.stringify(payload, null, 2));

      const ltResponse = await fetch(translateEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      console.log("[Translate] Response status:", ltResponse.status);

      if (!ltResponse.ok) {
        const errText = await ltResponse.text().catch(() => "");
        console.error("[Translate] API Error:", ltResponse.status, errText);
        throw new Error(`LibreTranslate error: ${ltResponse.status}`);
      }

      const ltData = await ltResponse.json();
      console.log("[Translate] Response data:", ltData);

      // LibreTranslate returns either "translatedText" or "translation"
      translatedText = ltData.translatedText || ltData.translation || "";

      if (!translatedText) {
        throw new Error("Empty translation from service");
      }

      console.log("[Translate] Success! Translated text:", translatedText);
    } catch (svcErr) {
      console.error(
        "[Translate] Service error, using fallback:",
        svcErr.message
      );
      // Use fallback translation - DEMO FALLBACK
      const langName = normalizedTarget.internal || normalizedTarget.iso;
      translatedText = `${text} [Translated to ${langName}]`;
      usedFallback = true;
    }

    const processingTime = Date.now() - startedAt;

    // Prepare data for history save, keeping internal target key for UI compatibility
    const targetInternalKey =
      normalizedTarget.internal ||
      isoToInternal[normalizedTarget.iso] ||
      normalizedTarget.iso;

    const translationData = {
      originalText: text,
      translatedText,
      targetLanguage: targetInternalKey,
      timestamp: new Date().toISOString(),
      processingTime,
      characterCount: text.length,
      wordCount: text.trim().split(/\s+/).length,
      userId: null,
      sessionId: req.headers["x-session-id"] || "anonymous",
    };

    // Save to database
    const saveResult = await saveTranslationToDatabase(translationData);

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        originalText: text,
        translatedText,
        targetLanguage: targetInternalKey,
        timestamp: new Date().toISOString(),
        processingTime,
        characterCount: text.length,
        wordCount: text.trim().split(/\s+/).length,
        saved: saveResult.saved,
        id: saveResult.id,
        usedFallback,
      },
      message: usedFallback
        ? "Translation completed using fallback (API unavailable)"
        : "Translation completed successfully",
    });
  } catch (error) {
    console.error("Translation API Error:", error);

    // Final fallback - always return something
    try {
      const { text: rawText, targetLanguage, language } = req.body || {};
      const requestedTarget = targetLanguage || language;

      if (rawText && requestedTarget) {
        const timestamp = new Date().toISOString();
        const fallbackText = `${rawText} [Translated to ${requestedTarget}]`;

        const translationData = {
          originalText: rawText,
          translatedText: fallbackText,
          targetLanguage: requestedTarget,
          timestamp,
          processingTime: 0,
          characterCount: rawText.length,
          wordCount: rawText.trim() ? rawText.trim().split(/\s+/).length : 0,
          userId: null,
          sessionId: req.headers["x-session-id"] || "anonymous",
        };

        const saveResult = await saveTranslationToDatabase(translationData);

        return res.status(200).json({
          success: true,
          data: {
            originalText: rawText,
            translatedText: fallbackText,
            targetLanguage: requestedTarget,
            timestamp,
            processingTime: 0,
            characterCount: translationData.characterCount,
            wordCount: translationData.wordCount,
            saved: saveResult.saved,
            id: saveResult.id,
            usedFallback: true,
          },
          message: "Translation completed using fallback (service error)",
        });
      }
    } catch (fallbackErr) {
      console.error("[Translate] Fallback flow failed:", fallbackErr);
    }

    // If we can't form a fallback, send error
    res.status(500).json({
      success: false,
      error: "Internal server error",
      message: "An error occurred while processing your translation request",
      timestamp: new Date().toISOString(),
    });
  }
}

// Database save function
async function saveTranslationToDatabase(translationData) {
  try {
    // For demo purposes, we'll skip database saving if Supabase is not configured
    // This prevents the translation from failing due to missing environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co') {
      console.log("[DB] Supabase not configured, skipping database save");
      return { success: true, saved: false, id: null };
    }

    // Call the history API to save the translation
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    const response = await fetch(`${baseUrl}/api/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        original_text: translationData.originalText,
        translated_text: translationData.translatedText,
        target_language: translationData.targetLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("[DB] Translation saved successfully:", result.data?.id);

    return { success: true, saved: true, id: result.data?.id };
  } catch (error) {
    console.error("[DB] Error saving translation:", error);
    // Don't fail the whole request if DB save fails
    return { success: false, saved: false, error: error.message };
  }
}
