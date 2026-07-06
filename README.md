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

## 🧭 V2.0 — Accounts & Dashboard (Milestone 4 of 5)

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

Milestone 5 (Stripe billing + plan gating) is not yet built.

## 🚀 Tech Stack

- **Next.js 14** (Pages Router) + React 18 — the app is one Next.js monolith;
  the marketing page itself is server-rendered vanilla HTML/CSS/JS
  (`pages/index.js`, `public/scripts/script.js`, `public/styles/style.css`), not
  a componentized React app.
- **Supabase (Postgres)** — required. Stores `sites`, `api_keys`, and
  `translation_history`. RLS is enabled on all three tables with **zero
  policies** (default-deny); the actual tenant boundary is the service-role
  client + `site_id` filtering in `lib/history.js` / `lib/auth/apiKeys.js`.
- **MyMemory** — the translation provider, called via `lib/translation/provider.js`
  (a seam intended for additional providers later, e.g. DeepL/OpenAI). Free, no
  API key required; LibreTranslate's public instance stopped serving
  unauthenticated requests, which is why this isn't LibreTranslate-backed.
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
│   │   └── session.js         # getSessionUser() for app/api/** Route Handlers
│   ├── translation/          # provider.js (MyMemory call), languages.js (internal<->ISO)
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
   then `006_add_api_key_label.sql` (V2.0 — accounts/projects/sites dashboard).
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
- **Styling**: `public/styles/style.css`.
- **Translation provider**: swap the implementation in `lib/translation/provider.js`;
  it's the seam intended for adding DeepL/OpenAI/etc. later.

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
