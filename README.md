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
- **Translation history** per site, with pagination and CSV export from the
  in-browser demo dashboard (see note below).

> **Note on the "Try Translation Dashboard" section on the marketing page**: it's
> a standalone sandbox that calls LibreTranslate/Google Translate directly from
> the browser with its own fallback logic. It is **not** connected to the
> productized widget/API path described in this README and exists purely as an
> interactive demo.

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
│   ├── scripts/script.js    # Marketing-page demo sandbox (not the productized path)
│   └── styles/style.css
├── pages/
│   ├── index.js              # Marketing page (SSR'd HTML)
│   └── api/
│       ├── translate.js      # Requires api_key + allowed origin
│       ├── history.js        # GET/POST/DELETE, site_id-scoped
│       ├── clearHistory.js
│       └── delete/[id].js
├── lib/
│   ├── auth/apiKeys.js       # Key generation/hashing/validation, origin resolution
│   ├── translation/          # provider.js (MyMemory call), languages.js (internal<->ISO)
│   ├── history.js            # site_id-scoped translation_history CRUD
│   ├── rateLimit.js          # Upstash sliding-window limiter
│   └── supabase/
│       ├── admin.js           # Service-role client, used inside pages/api/* only
│       ├── client.ts          # Browser anon client (currently unused)
│       └── server.ts          # Cookie-based client for a future session/App Router phase
├── scripts/
│   ├── 001_create_translation_history.sql
│   ├── 002_create_sites_and_api_keys.sql
│   ├── 003_add_site_id_to_translation_history.sql
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
   then `003_add_site_id_to_translation_history.sql`. Migration 003 truncates
   `translation_history` (it only ever held unscoped demo data).

4. **Issue your first site + API key** (local-only, never an HTTP endpoint):
   ```bash
   npm run create-site -- --name "My Site" --email you@example.com --origin localhost
   ```
   This prints an API key once — save it — and a ready-to-paste embed snippet.

5. **Run the dev server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000`.

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
your first API key.

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
