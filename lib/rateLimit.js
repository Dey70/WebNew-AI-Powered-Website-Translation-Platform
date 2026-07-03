import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

let limiter = null;

function getLimiter() {
  if (limiter) return limiter;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    // Per site_id, not per-IP: a widget is called by many different end-user
    // browsers on behalf of one tenant, so per-IP would punish legitimate
    // traffic on a popular site while doing little against a single attacker
    // reusing one leaked key from one machine.
    limiter: Ratelimit.slidingWindow(60, "10 s"),
    prefix: "webnew:rl:translate",
  });
  return limiter;
}

/**
 * Returns { allowed, remaining, reset } where reset is a unix ms timestamp.
 * If Upstash isn't configured (e.g. local dev without it set up), rate
 * limiting is skipped entirely rather than failing requests closed.
 */
export async function checkRateLimit(siteId) {
  const rl = getLimiter();
  if (!rl) return { allowed: true, remaining: null, reset: null };

  const { success, remaining, reset } = await rl.limit(siteId);
  return { allowed: success, remaining, reset };
}
