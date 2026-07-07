// Only allow a same-origin relative path -- rejects protocol-relative ("//"),
// scheme-qualified ("https://..."), and the user@host trick ("@evil.com",
// which a browser resolves to host "evil.com" once concatenated onto our
// origin). None of our own flows (login/signup/forgot-password) ever supply
// `next`, so this is locking down dead flexibility, not removing a feature.
export function safeRedirectPath(next, fallback = "/dashboard") {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//")) {
    return fallback;
  }
  if (next.includes("@") || next.includes("\\")) {
    return fallback;
  }
  return next;
}
