import { getServiceClient } from "@/lib/supabase/admin";
import { listTranslations } from "@/lib/history";

/**
 * Success-only analytics from what translation_history actually captures
 * (site_id, target_language, created_at) -- failed translations are never
 * persisted anywhere today (pages/api/translate.js only logs successes), so
 * there is no honest way to report an error rate from this table. Scoped by
 * site_id, same tenant boundary as the rest of lib/history.js.
 */

function dayKey(isoString) {
  return isoString.slice(0, 10); // "YYYY-MM-DD"
}

export async function getSiteAnalytics({ siteId, days = 30 }) {
  const supabase = getServiceClient();
  if (!supabase) {
    return { totalCount: 0, dailyCounts: [], languageCounts: [], recent: [] };
  }

  const { count: totalCount, error: totalError } = await supabase
    .from("translation_history")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId);

  if (totalError) {
    console.error("[analytics] total count query failed:", totalError.message);
  }

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows, error: rowsError } = await supabase
    .from("translation_history")
    .select("created_at, target_language")
    .eq("site_id", siteId)
    .gte("created_at", since);

  if (rowsError) {
    console.error("[analytics] windowed rows query failed:", rowsError.message);
  }

  const dailyMap = new Map();
  const languageMap = new Map();
  for (const row of rows || []) {
    const day = dayKey(row.created_at);
    dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
    languageMap.set(row.target_language, (languageMap.get(row.target_language) || 0) + 1);
  }

  // Zero-fill every day in the window so the chart doesn't skip gaps.
  const dailyCounts = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = dayKey(new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString());
    dailyCounts.push({ day, count: dailyMap.get(day) || 0 });
  }

  const languageCounts = Array.from(languageMap.entries())
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count);

  const recent = await listTranslations({ siteId, page: 1, limit: 10 });

  return {
    totalCount: totalCount || 0,
    dailyCounts,
    languageCounts,
    recent: recent.data,
  };
}
