import { getServiceClient } from "@/lib/supabase/admin";

/**
 * All operations here are scoped by site_id -- never touch a row without it.
 * Uses the service-role client (bypasses RLS), so this scoping in application
 * code IS the tenant boundary, not a formality.
 */

export async function saveTranslation({ siteId, originalText, translatedText, targetLanguage, characterCount, wordCount }) {
  const supabase = getServiceClient();
  if (!supabase) return { saved: false, id: null };

  const { data, error } = await supabase
    .from("translation_history")
    .insert({
      site_id: siteId,
      original_text: originalText,
      translated_text: translatedText,
      target_language: targetLanguage,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[history] saveTranslation failed:", error.message);
    return { saved: false, id: null };
  }

  return { saved: true, id: data.id };
}

export async function listTranslations({ siteId, page = 1, limit = 10 }) {
  const supabase = getServiceClient();
  if (!supabase) {
    return { data: [], count: 0, total: 0, page, limit, totalPages: 0 };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const offset = (pageNum - 1) * limitNum;

  const { data, error, count } = await supabase
    .from("translation_history")
    .select("*", { count: "exact" })
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limitNum - 1);

  if (error) {
    console.error("[history] listTranslations failed:", error.message);
    return { data: [], count: 0, total: 0, page: pageNum, limit: limitNum, totalPages: 0 };
  }

  return {
    data: data || [],
    count: (data || []).length,
    total: count || 0,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil((count || 0) / limitNum),
  };
}

export async function deleteTranslation({ siteId, id }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: true };

  const { error } = await supabase
    .from("translation_history")
    .delete()
    .eq("id", id)
    .eq("site_id", siteId);

  if (error) {
    console.error("[history] deleteTranslation failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function clearTranslations({ siteId }) {
  const supabase = getServiceClient();
  if (!supabase) return { ok: true };

  const { error } = await supabase
    .from("translation_history")
    .delete()
    .eq("site_id", siteId);

  if (error) {
    console.error("[history] clearTranslations failed:", error.message);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
