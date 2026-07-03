// Internal language keys used by the UI/widget <-> ISO 639-1 codes used by translation providers.
export const internalToIso = {
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

export const isoToInternal = Object.fromEntries(
  Object.entries(internalToIso).map(([k, v]) => [v, k])
);

export const validInternalLanguages = Object.keys(internalToIso);

/**
 * Accepts either an internal key (e.g. "french") or an ISO code (e.g. "fr")
 * and returns both forms. Falls back to treating unknown values as already-ISO.
 */
export function normalizeLang(value, fallbackInternal) {
  if (!value) return { iso: "en", internal: fallbackInternal };
  const lower = String(value).toLowerCase();
  if (internalToIso[lower]) return { iso: internalToIso[lower], internal: lower };
  if (isoToInternal[lower]) return { iso: lower, internal: isoToInternal[lower] };
  return { iso: lower, internal: lower };
}

export function isSupportedTarget(normalizedTarget) {
  return (
    validInternalLanguages.includes(normalizedTarget.internal) ||
    Boolean(isoToInternal[normalizedTarget.iso])
  );
}
