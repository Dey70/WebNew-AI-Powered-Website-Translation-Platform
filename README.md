# WebNew - Website Translation Platform

An embeddable, multi-tenant website translation widget: drop one `<script>` tag on
any site and let visitors translate it into 10+ languages. Built with Next.js
(Pages Router) + Supabase (Postgres) + MyMemory.

Each embed is tied to a **site** (a registered domain) and an **API key** issued
for that site — there is no shared, unauthenticated translation endpoint.

## 🌟 Features

- **Embeddable widget** (`public/cdn/webnew.js`): walks the page's DOM text nodes,
  translates them via `/api/translate`, caches results in `localStorage`, detects
  the visitor's browser language, and renders a floating language switcher.
- **Multi-tenant by design**: every site gets its own API key; every translation
  and history row is scoped to that site (`site_id`), enforced in application
  code via a Supabase service-role client — not just RLS.
- **Honest failures**: if the translation provider is down, the API returns an
  explicit `success:false` + machine-readable error code. It never fabricates a
  fake translation.
- **Per-site rate limiting** via Upstash Redis (sliding window).
- **Translation history** per site, with pagination via the `/api/history`
  endpoint.

## 🧭 V2.0 — Accounts & Dashboard (complete)

V2.0 is turning WebNew into a self-serve SaaS (accounts, dashboard, billing) on
top of the V1.0 widget/API described above, without changing how the widget or
`/api/*` routes work.

**Milestone 1 (users, auth, sessions)**:

- **Supabase Auth** for identity — email/password with email verification,
  forgot/reset password, logout-everywhere. OAuth via `signInWithOAuth`; Google
  and GitHub are enabled today, Microsoft (`azure`) uses the same code path but
  isn't enabled yet. No custom password hashing/JWT code; this reuses the
  Supabase project V1.0 already depends on.
- A new `app/` (App Router) tree — `login`, `signup`, `forgot-password`,
  `reset-password`, `auth/callback`, and a session-guarded `dashboard` — living
  alongside the existing `pages/` (Pages Router) marketing site + API routes.
  Styled with Tailwind, scoped only to `app/**`.
- `middleware.js` refreshes the Supabase session cookie, matched only against
  the new auth/dashboard routes — it never runs for `/api/*`, `/cdn/*`, or the
  marketing page.
- New tables: `public.profiles` (auto-populated from `auth.users` via trigger)
  and `public.projects`. `public.sites` gained nullable `owner_id`/`project_id`
  columns so existing CLI-created sites are unaffected.

**Milestone 2 (projects + sites dashboard, replacing the CLI)**:

- Dashboard UI to create/archive/delete projects and register/edit/pause/
  delete sites under them — the same operations `scripts/create-site.js`/
  `list-sites.js`/`revoke-api-key.js` do, now self-serve. The CLI scripts are
  unchanged and still work for local/admin use.
- `sites`/`api_keys` still have zero RLS policies by design (see below), so the
  dashboard talks to them through new session-authenticated Route Handlers
  (`app/api/projects/**`, `app/api/sites/**`) that use the service-role client
  filtered by `owner_id` — the same "service-role + explicit tenant filtering"
  pattern already used for `site_id`, just at the account level.
- `lib/projects.js` and `lib/sites.js` are the data-access layer (mirroring
  `lib/history.js`'s shape); `lib/sites.js` reuses `generateApiKey`/
  `hashApiKey`/`normalizeHostname` from `lib/auth/apiKeys.js` rather than
  duplicating key-generation logic the way the CLI script does.
- Milestone 2 shipped "revoke & regenerate" as one atomic action (a stop-gap
  so a site was never left un-recoverable from the dashboard) — superseded by
  Milestone 3 below.

**Milestone 3 (API key management UI)**:

- Multiple named, simultaneously-active API keys per site (e.g. "Production"
  vs "Staging") — `api_keys` already had no uniqueness constraint on
  `is_active` per site, so this was a data-layer non-issue; the gaps were a
  `label` column (migration `006_add_api_key_label.sql`) and application logic
  that always revoked-then-created exactly one.
- `POST /api/sites/[id]/keys` (create, optional label) and
  `DELETE /api/sites/[id]/keys/[keyId]` (revoke one specific key) replace the
  old combined regenerate endpoint — enabling real zero-downtime rotation:
  create the new key, update the live embed, then revoke the old key on your
  own schedule, instead of an instant cutover.
- `lib/sites.js`'s `createApiKey`/`revokeApiKey` cap active keys at 5 per site
  (light abuse/clutter guard) and scope every mutation by both the relevant
  key's `id` and its `site_id`, same "scope by every relevant id" pattern used
  throughout.
- The site detail page now lists every key (active and revoked) with label,
  prefix, created/last-used dates, and a per-key revoke action, instead of a
  single current-key display.

**Milestone 4 (usage/analytics view)**:

- Per-site analytics page (`.../sites/[siteId]/analytics`) built from what
  `translation_history` actually captures — `site_id`, `target_language`,
  `created_at`. Only *successful* translations are ever persisted (a failed
  provider call just returns an error to the caller and is never logged
  anywhere), so this is honestly scoped to what's real: all-time and
  last-30-days totals, a requests-per-day chart, a breakdown by target
  language, and recent activity. Visitors, countries, page views, provider
  usage, cache-hit rate, and error rate all need instrumentation that doesn't
  exist yet (the widget never reports that data, and failures aren't logged)
  — explicitly deferred rather than fabricated.
- `lib/analytics.js`'s `getSiteAnalytics` mirrors `lib/history.js`'s shape,
  reuses `listTranslations` for the recent-activity list instead of a
  duplicate query, and aggregates day/language counts in application code
  (no new SQL views needed at this data volume).
- The daily-requests bar chart and language-breakdown bars are plain
  SVG/CSS — no charting library — using a single validated accent hue
  (`#2a78d6`) via the `dataviz` skill's method rather than ad hoc colors.

V2.0's original roadmap had a 5th milestone (Stripe billing + plan gating),
deliberately dropped — this deployment doesn't monetize, so a payments layer
would be pure overhead with no product benefit. V2.0 is considered complete
as of Milestone 4.

## 🔌 V3.0 — Pluggable Translation Providers

`lib/translation/provider.js` always had a comment calling itself "the seam
future providers plug into" — nothing had ever actually plugged into it until
now. It's now a thin dispatcher over `lib/translation/providers/mymemory.js`
and `lib/translation/providers/deepl.js`, each exporting the same
`translate(text, sourceIso, targetIso, config)` contract (honest
`{ok, translatedText}` / `{ok:false, reason, detail}` — DeepL's own
quota-exceeded status (HTTP 456) maps to the same `provider_error` reason
MyMemory's embedded quota errors already use).

- **Per-site choice, not global**: `sites.provider` (migration
  `007_add_site_provider.sql`, defaults every existing site to `mymemory`) —
  changeable via a "Translation provider" dropdown on the site detail page.
  `lib/auth/apiKeys.js`'s `resolveSiteFromApiKey` already selects the site row
  on every request, so reading `provider` off it is free — no extra query.
- **DeepL** is opt-in per site, using one global `DEEPL_API_KEY` (free tier,
  500,000 characters/month, no credit card required) — same "one
  owner-configured credential shared across every site that opts in" pattern
  `MYMEMORY_EMAIL` already uses, not a per-tenant key. DeepL's `target_lang`
  codes diverge from plain ISO (uppercase, and Portuguese needs `PT-PT`
  specifically) — that mapping lives in `providers/deepl.js` itself, not the
  shared `lib/translation/languages.js`, since it's DeepL-specific.
- **SEO was dropped from V3's original scope**: the widget translates
  client-side after page load with no server-rendered per-language URLs, so
  real hreflang/sitemap SEO would need a much bigger architecture change
  (effectively a rendering proxy) — not a V3-sized feature.

## 🔐 V4.0 — Milestone 1: Two-Factor Authentication (TOTP)

Supabase Auth has TOTP MFA built in natively (managed entirely in Supabase's
own `auth.mfa_factors` table) — no new migration, this is wiring up an
existing platform feature:

- **`app/dashboard/security/page.js`** — enroll (QR + manual secret + verify
  code), view status, remove a factor.
- **`app/mfa-challenge/page.js`** — the post-login code-entry step for
  accounts with 2FA enabled.
- **The actual enforcement is server-side**, in `app/dashboard/layout.js`
  (the same guard that already checks for a session): after `getUser()`, it
  now also calls `supabase.auth.mfa.getAuthenticatorAssuranceLevel()` and
  redirects to `/mfa-challenge` if the session hasn't completed a required
  challenge yet. This runs on every dashboard page load regardless of sign-in
  method (password, Google, GitHub), so there's no path that skips it — not
  just a client-side redirect on the login page (which also checks, for
  smoother UX, but isn't the actual security boundary).
- Both `/login` and `/mfa-challenge` use a hard navigation
  (`window.location.href`) rather than `router.push`+`router.refresh()` for
  their post-auth redirect into `/dashboard` — found via live testing that
  the client-side push could race the Supabase auth cookie actually
  committing, so the dashboard layout's server-side check would read stale
  state and silently bounce back to the same page.

## 🛡️ V4.0 — Milestone 2: Security Pass

"Device sessions list with per-device revoke" (`context.md`'s original
wording) isn't actually buildable with what Supabase's client SDK exposes to
a regular user — no per-session device/IP metadata, no revoke-by-arbitrary-
session-id. What it does support: `signOut({ scope: 'others' })`, which kills
every other session in one action (`app/dashboard/security/page.js`'s new
"Log out of all other sessions" button) — same reality-check as V3's SEO
scoping.

The rest of this milestone is an actual audit of the auth-critical code
paths, not a formality — found two real, concrete issues:

- **Open redirect in `app/auth/callback/route.js`**: the `next` query param
  was concatenated unsanitized into a redirect (`${origin}${next}`). A value
  like `next=@evil.com` produces a URL where `evil.com` becomes the actual
  host per URL-parsing rules (the `user@host` trick) — a real phishing
  vector, and dead flexibility besides (no flow of ours ever sets `next`).
  Fixed with `lib/auth/redirect.js`'s `safeRedirectPath` — only a same-origin
  relative path (no `//`, no `@`, no backslashes) is allowed through,
  everything else falls back to `/dashboard`. Covered by
  `tests/unit/redirect.test.js`.
- **`middleware.js`'s matcher was missing `/mfa-challenge`** — added during
  the 2FA milestone but never added to the session-refresh matcher.

## 🚀 Tech Stack

- **Next.js 14** (Pages Router) + React 18 — the app is one Next.js monolith;
  the marketing page itself is server-rendered vanilla HTML/CSS/JS
  (`pages/index.js`, `public/scripts/script.js`, `public/styles/style.css`), not
  a componentized React app.
- **Supabase (Postgres)** — required. Stores `sites`, `api_keys`, and
  `translation_history`. RLS is enabled on all three tables with **zero
  policies** (default-deny); the actual tenant boundary is the service-role
  client + `site_id` filtering in `lib/history.js` / `lib/auth/apiKeys.js`.
- **MyMemory** (default) and **DeepL** (opt-in per site) — pluggable
  translation providers behind `lib/translation/provider.js`'s dispatcher (see
  V3.0 above). MyMemory needs no API key; LibreTranslate's public instance
  stopped serving unauthenticated requests, which is why the default isn't
  LibreTranslate-backed.
- **Upstash Redis** — per-site rate limiting (optional in local dev; skipped
  entirely if not configured).
- **Vitest** (unit) + **Playwright** (e2e) for testing.

## 📁 Project Structure

```
├── public/
│   ├── cdn/webnew.js        # The embeddable widget
│   ├── scripts/script.js    # Marketing-page UI only (menu, embed-snippet copy button)
│   └── styles/style.css
├── pages/
│   ├── index.js              # Marketing page (SSR'd HTML)
│   └── api/
│       ├── translate.js      # Requires api_key + allowed origin
│       ├── history.js        # GET/POST/DELETE, site_id-scoped
│       ├── clearHistory.js
│       └── delete/[id].js
├── app/                       # V2.0 — App Router (accounts/dashboard), Tailwind
│   ├── layout.js, globals.css
│   ├── login/, signup/, forgot-password/, reset-password/
│   ├── auth/callback/route.js # OAuth/email-verification code exchange
│   ├── dashboard/             # Session-guarded (redirects to /login if signed out)
│   │   ├── page.js                                 # Project list
│   │   └── projects/[projectId]/
│   │       ├── page.js                             # Project detail + site list
│   │       └── sites/[siteId]/
│   │           ├── page.js                         # Site detail: origins, keys, embed snippet
│   │           └── analytics/page.js               # Per-site usage analytics (Milestone 4)
│   └── api/                   # Session-authenticated (owner_id-scoped), NOT the api_key-authenticated
│       ├── projects/route.js, projects/[id]/route.js       # ones under pages/api/*
│       └── sites/route.js, sites/[id]/route.js, sites/[id]/keys/route.js,
│           sites/[id]/keys/[keyId]/route.js, sites/[id]/analytics/route.js
├── middleware.js               # Supabase session refresh, scoped to app/ routes only
├── lib/
│   ├── auth/
│   │   ├── apiKeys.js         # Key generation/hashing/validation, origin resolution
│   │   ├── session.js         # getSessionUser() for app/api/** Route Handlers
│   │   └── redirect.js        # safeRedirectPath() -- open-redirect guard for /auth/callback
│   ├── translation/
│   │   ├── provider.js        # Dispatcher -- picks a site's configured provider
│   │   ├── providers/mymemory.js, providers/deepl.js
│   │   └── languages.js       # internal key <-> ISO 639-1 (shared across providers)
│   ├── history.js            # site_id-scoped translation_history CRUD
│   ├── analytics.js          # site_id-scoped usage aggregation (success-only)
│   ├── projects.js           # owner_id-scoped projects CRUD
│   ├── sites.js               # owner_id-scoped sites CRUD + API key issuance/revocation
│   ├── rateLimit.js          # Upstash sliding-window limiter
│   └── supabase/
│       ├── admin.js           # Service-role client, used inside pages/api/* and app/api/* only
│       ├── client.ts          # Browser Supabase Auth client (app/**, "use client")
│       └── server.ts          # Cookie-based server client (app/** server components/routes)
├── scripts/
│   ├── 001_create_translation_history.sql
│   ├── 002_create_sites_and_api_keys.sql
│   ├── 003_add_site_id_to_translation_history.sql
│   ├── 004_create_profiles_and_projects.sql   # V2.0 Milestone 1
│   ├── 005_add_projects_slug_unique.sql       # V2.0 Milestone 2
│   ├── 006_add_api_key_label.sql              # V2.0 Milestone 3
│   ├── 007_add_site_provider.sql              # V3.0
│   ├── create-site.js        # Local-only onboarding CLI (issues an API key)
│   ├── list-sites.js
│   └── revoke-api-key.js
├── tests/
│   ├── unit/                  # Vitest
│   └── e2e/, fixtures/         # Playwright
└── .env.example
```

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+
- A Supabase project (required — the widget can't authenticate without it)
- Optional: an Upstash Redis database (for rate limiting)

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Copy `.env.example` to `.env.local`** and fill in your Supabase project URL,
   anon key, and **service role key** (Project Settings → API in Supabase), plus
   an `API_KEY_PEPPER`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Run the migrations** against your Supabase project's SQL Editor, in order:
   `scripts/001_create_translation_history.sql`, then `002_create_sites_and_api_keys.sql`,
   then `003_add_site_id_to_translation_history.sql`, then
   `004_create_profiles_and_projects.sql`, then `005_add_projects_slug_unique.sql`,
   then `006_add_api_key_label.sql`, then `007_add_site_provider.sql`.
   Migration 003 truncates `translation_history` (it only ever held unscoped
   demo data).

4. **Issue your first site + API key** (local-only, never an HTTP endpoint):
   ```bash
   npm run create-site -- --name "My Site" --email you@example.com --origin localhost
   ```
   This prints an API key once — save it — and a ready-to-paste embed snippet.

5. **Configure Supabase Auth** (Project Settings → Authentication):
   - **URL Configuration**: set Site URL and add Redirect URLs for both
     `http://localhost:3000/auth/callback` and your deployed domain's
     `/auth/callback`.
   - **Providers**: email/password is on by default. To enable Google/GitHub/
     Microsoft login, register an OAuth app with each provider and paste its
     client ID/secret into Authentication → Providers — the login page's OAuth
     buttons work as soon as a provider is enabled, no code changes needed.

6. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`, or `http://localhost:3000/login` to sign up/in.

Other onboarding scripts: `npm run list-sites` (read-only), `npm run revoke-api-key -- --prefix wn_live_xxxx`.

## 🧪 Testing

```bash
npm run test       # Vitest unit tests (auth, rate limiting, translate/history routes)
npm run test:e2e   # Playwright: loads a fixture page with the widget embedded,
                    # mocks /api/translate at the network layer, and asserts the
                    # widget correctly rewrites text on success and leaves it
                    # untouched on failure.
```

## 🔧 API

### `POST /api/translate`
```json
{
  "text": "Hello world",
  "sourceLanguage": "en",
  "targetLanguage": "french",
  "api_key": "wn_live_...",
  "hostname": "www.example.com"
}
```
Success: `{ "success": true, "data": { "translatedText": "...", ... } }`
Failure: `{ "success": false, "error": "invalid_api_key" | "origin_not_allowed" | "rate_limited" | "provider_unavailable" | ..., "message": "..." }`
with the corresponding HTTP status (400/401/403/429/502).

### `GET/POST/DELETE /api/history`, `DELETE /api/clearHistory`, `DELETE /api/delete/[id]`
All require `api_key` (query param for GET/DELETE, body for POST) and are scoped
to the resolved site — a key for one site can never read or delete another
site's rows.

## 🔌 Embedding the widget

```html
<script
  src="https://your-deployment-domain.com/cdn/webnew.js"
  data-base-url="https://your-deployment-domain.com"
  data-api-key="YOUR_API_KEY"
  data-default-lang=""
  async
></script>
```
Leave `data-default-lang` empty to auto-detect from the visitor's browser.
Switch language programmatically with `WebNewTranslate.setLanguage('french')`
(use `'english'` to restore the original text).

## 🎨 Customization

- **Adding languages**: update `SUPPORTED_INTERNAL`/`isoToInternal` in
  `public/cdn/webnew.js` and `lib/translation/languages.js` together — they must
  stay in sync.
- **Styling**: marketing page is `public/styles/style.css`. The `app/**`
  dashboard/auth pages use Tailwind, themed to match that same black/red
  brand exactly — the `brand` color scale and gradient utilities are defined
  in `tailwind.config.js` (extracted directly from `style.css`'s `.cta-button`/
  body/`.pricing-card` rules, not approximated), so new dashboard UI should
  reuse those tokens (`bg-brand-cta`, `border-brand-red-500`, etc.) rather
  than reintroducing the old slate/white defaults.
- **Translation provider**: MyMemory and DeepL are already pluggable per site
  (see V3.0 above). Adding a third: create `lib/translation/providers/<name>.js`
  exporting the same `translate(text, sourceIso, targetIso, config)` contract,
  add it to the `PROVIDERS` map in `lib/translation/provider.js`, and it's
  selectable from the site detail page's dropdown.

## 🚀 Deployment

Deploy to **Vercel** (auto-detects Next.js). Set the environment variables from
`.env.example` in the Vercel project settings, run the SQL migrations against
your Supabase project, and run `scripts/create-site.js` once locally to issue
your first API key. For V2.0, also add the deployed domain's `/auth/callback`
URL to Supabase's Auth redirect URL allowlist — no new environment variables
are required, the dashboard reuses `NEXT_PUBLIC_SUPABASE_URL`/`_ANON_KEY`.

This project is no longer deployed to GitHub Pages — GitHub Pages serves static
files only and cannot run the `/api/*` routes the widget depends on.

## 🐛 Troubleshooting

- **401 `invalid_api_key`**: check the key was copied in full and hasn't been
  revoked (`npm run list-sites` to check status).
- **403 `origin_not_allowed`**: the requesting page's origin isn't in that
  site's `allowed_origins` — check what was passed to `create-site.js`.
- **429 `rate_limited`**: the site exceeded its per-10-second request budget;
  the widget backs off automatically using `Retry-After`.
- **502 provider errors**: MyMemory is unreachable, rate-limited, or its daily
  quota was hit — check `MYMEMORY_EMAIL` is set (raises the anonymous limit)
  and MyMemory's own status.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
