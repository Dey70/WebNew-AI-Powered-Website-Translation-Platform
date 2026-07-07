# WebNew — Roadmap & Project Context

This is the canonical planning reference for WebNew, maintained as the project evolves. It replaces the original V1.0→V5.0 planning document (which was never actually committed to the repo — this file now is).

## Ground rules (unchanged from the original plan)

You are continuing an existing production codebase, not building a new one. Preserve architecture, coding style, naming conventions, security model, and folder structure already in place. Never rewrite working code without a compelling reason. Extend, don't replace.

---

## V1.0 — Widget hardening (complete)

Turned an internship-prototype demo into a real, safely multi-tenant product: API-key auth with origin validation, per-site rate limiting, honest translation failures (no fabricated success), a hardened embeddable widget, and a real deployment. See git history (`main`) for the full V1.0 commit record — this file no longer restates it in detail.

## V2.0 — Accounts & Dashboard (complete, 4 milestones)

Turned the CLI-only, API-key-only product into a self-serve dashboard SaaS:

1. **Auth & sessions** — Supabase Auth (email/password, Google + GitHub OAuth), session-guarded dashboard.
2. **Projects + sites dashboard** — replaces `scripts/create-site.js`/`list-sites.js`/`revoke-api-key.js` entirely.
3. **API key management** — multiple named keys per site, zero-downtime rotation.
4. **Usage/analytics** — per-site request volume, language breakdown, recent activity, honestly scoped to what's actually captured (no fabricated visitor/provider/error stats).

**Billing was deliberately dropped from V2's original scope.** The original plan had a 5th milestone (Stripe subscriptions, plan tiers, usage-based gating) — removed outright because this deployment doesn't monetize, and a payments layer would be pure overhead with no product benefit. Every billing-adjacent item from the original wishlist is removed for the same reason, including:
- Subscription plans/tiers, Stripe checkout, invoices, coupons, tax, trial/grace periods
- Plan-based feature gating (site/language/request limits tied to a paid tier)
- Billing info in user profiles; Billing/Subscription dashboard pages
- Billing-related notifications and emails (plan upgrade, usage warning, subscription expiring)
- Subscriptions/Payments management in the admin panel
- "Translation Cost" tracking (a billing concept — cost only matters if you're charging for it)

What legitimately remains open from V2's original wishlist, not yet built (none of it billing-related): a dedicated Settings/Account page, Notifications preferences UI, Help Center, and the fuller Translation Dashboard features (Failed Requests view, Cache Hits, Translation Memory, Search/Filter, CSV export, Restore Previous Translation). These are small, realistic, non-billing gaps — pick up opportunistically if useful, not a committed milestone.

---

## V3.0 — Pluggable providers, SEO (revised: CMS plugin dropped)

- **Pluggable translation providers** — realistic, low-effort: `lib/translation/provider.js` already has the seam built for this ("the seam future providers — DeepL, OpenAI, etc. — plug into"). Add a second provider behind that seam, plus a way to pick which one a site uses.
- **SEO** — realistic, moderate effort: translated meta titles/descriptions, hreflang tags, sitemap handling for translated content.
- ~~**One CMS plugin**~~ — **dropped as unrealistic.** A real WordPress/Webflow/Shopify plugin is a separate codebase in a separate ecosystem (PHP for WordPress, a different app-review/distribution process for the others) — a much bigger lift than "one more V3 item," and the embed `<script>` snippet already gives any CMS a working integration path today. Revisit only if a specific platform's users are actually asking for it.

## V4.0 — Team roles, 2FA, security pass

- **Team roles** — realistic, moderate effort: `projects.owner_id`/`sites.owner_id` are strictly single-owner today; this needs a members/roles table and an invite flow. ("Invite Members" was explicitly stubbed as "disabled until V4" in the original plan.)
- **2FA** — realistic, low-effort: Supabase Auth has native TOTP MFA support, so this is mostly wiring up an existing platform feature, not building crypto from scratch.
- **Security pass** — realistic, moderate effort: the "device sessions list with per-device revoke" item explicitly deferred back in V2 Milestone 1 lands here, plus a general audit of the auth/dashboard surface now that it's seen real usage.

## ~~V5.0~~ — dropped

The original V5 (white-label, Kubernetes deployment, extra CMS plugins) was labeled "demand-gated" in the very first plan — build only if actual customer demand shows up. Since there's no paying-customer base driving that demand, it's removed from the roadmap rather than carried forward as a placeholder. If real demand for any of this ever materializes, it gets scoped fresh at that time, not resurrected from this list.

---

## Current state: what's next

V1 and V2 are done. V3 (pluggable providers + SEO) and V4 (team roles + 2FA + security pass) are the only two planned versions left, both revised down to concretely implementable scope. Nothing is committed to being built next until you pick one.
