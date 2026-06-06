# LocaleMate — Project Reference (agent.md)

> **Last updated:** 2026-06-06
> **Author:** Prabhat Prajapati
> **Purpose:** Complete project reference for any AI model to understand and continue working on this codebase.

---

## 1. Project Overview

**LocaleMate** is a Shopify embedded app for AI-powered localized marketing. It helps ecommerce store owners generate culturally-relevant marketing campaigns and headline suggestions for different global markets.

**Key Features:**
- Dynamic Market Dashboard — real-time analytics per country, synced with Shopify
- AI Campaign Generator — generates full marketing campaigns (headline, ad copy, CTA, hashtags, audience, strategy)
- AI Suggestions Table — generates optimized headline suggestions per market/country
- Beautiful parsed campaign results UI (not raw markdown)
- Full CRUD with PostgreSQL database
- Shopify Admin GraphQL API integration (markets, orders, translations, locales)
- OpenRouter AI integration (GPT-4o Mini)

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + React Router 7 |
| **Build Tool** | Vite |
| **CSS** | TailwindCSS 3 |
| **Icons** | lucide-react |
| **Backend (Express)** | Node.js + Express 5 (port 5000, for campaigns/suggestions APIs) |
| **Backend (Shopify)** | React Router server loaders/actions (for dashboard, Shopify-authenticated) |
| **Database** | PostgreSQL (Neon cloud) |
| **ORM** | Prisma 6.19 |
| **AI API** | OpenRouter (model: `openai/gpt-4o-mini`) |
| **Shopify API** | Shopify Admin GraphQL API (October25) |
| **HTTP Client** | Axios |
| **Shopify** | Shopify App Bridge + React Router integration |
| **Package Type** | ES Modules (`"type": "module"` in package.json) |

---

## 3. Project Structure

```
locale-mate/
├── server.js                          # Express backend entry point (port 5000)
├── agent.md                           # THIS FILE — project reference for AI models
├── package.json                       # Dependencies and scripts
├── .env                               # Environment variables (secrets)
├── .env.example                       # Template for .env
├── vite.config.js                     # Vite configuration
├── react-router.config.js             # React Router config loading the @vercel/react-router preset
├── tailwind.config.js                 # TailwindCSS config
├── shopify.app.localemate.toml        # Shopify app config (scopes, webhooks)
├── shopify.web.toml                   # Shopify web config
├── vercel.json                        # Vercel deployment config (specifies custom build command)
├── Dockerfile                         # Production Docker deployment config (for Render)
│
├── prisma/
│   ├── schema.prisma                  # Database schema (8 models)
│   ├── seed.js                        # Seeds 4 markets + 120 analytics records
│   └── migrations/                    # Applied migrations
│       ├── 20260529151043_init/
│       ├── 20260529203601_add_campaign/
│       ├── 20260529212456_add_suggestion/
│       └── 20260530143635_add_market_models/
│
├── lib/
│   └── prisma.js                      # Prisma client singleton (for Express server)
│
├── routes/                            # Express routes (standalone backend)
│   ├── campaignRoutes.js              # Express routes: /api/campaigns/*
│   └── suggestionRoutes.js            # Express routes: /api/suggestions/*
│
├── controllers/                       # Express controllers
│   ├── campaignController.js          # Campaign CRUD + AI generation logic
│   └── suggestionController.js        # Suggestion CRUD + AI generation logic
│
├── services/                          # Express services (standalone backend)
│   ├── openrouterService.js           # AI campaign generation (full markdown response)
│   └── openrouterSuggestionService.js # AI headline suggestion (JSON response)
│
├── middleware/
│   └── errorHandler.js                # Global Express error handler
│
├── utils/
│   └── api.js                         # Frontend axios wrapper (all API methods)
│
├── app/
│   ├── root.jsx                       # Root layout
│   ├── routes.js                      # React Router file-based routing config
│   ├── db.server.js                   # Prisma client singleton (for Shopify route loaders)
│   ├── shopify.server.js              # Shopify auth/admin setup
│   ├── entry.server.jsx               # SSR entry
│   ├── tailwind.css                   # Global styles
│   │
│   ├── services/                      # Server-side services (Shopify-authenticated)
│   │   ├── shopifyApi.server.js       # Shopify GraphQL queries (markets, orders, translations, currencies)
│   │   └── scoring.js                 # Localization score, conversion rate, trend calculators
│   │
│   ├── routes/
│   │   ├── app.jsx                    # App shell layout (Sidebar nav: Dashboard, Campaigns, Suggestions)
│   │   ├── app._index.jsx             # Dashboard page — DYNAMIC (loader + action + Add Market modal)
│   │   ├── app.campaigns.jsx          # Campaigns page → renders CampaignGenerator
│   │   ├── app.suggestions.jsx        # Suggestions page → renders SuggestionsTable
│   │   ├── app.additional.jsx         # Additional/settings page
│   │   ├── app.api.markets.jsx        # Resource route — Market CRUD (POST/PUT/DELETE)
│   │   ├── app.api.sync.jsx           # Resource route — Shopify data sync
│   │   ├── _index.jsx                 # Root index redirect
│   │   ├── auth.$.jsx                 # Auth callback
│   │   └── auth.login/               # Login route
│   │
│   └── components/
│       ├── Header.jsx                 # Top header (functional "Last 30 days" + "Add market" buttons)
│       ├── Sidebar.jsx                # Left sidebar navigation
│       │
│       ├── dashboard/
│       │   ├── dashboardData.js       # ONLY preset campaign cards (markets removed — now from DB)
│       │   ├── CampaignGenerator.jsx  # Campaign generator UI (preset cards + custom form)
│       │   ├── CampaignResult.jsx     # Beautiful parsed campaign result (sections → styled cards)
│       │   ├── SuggestionsTable.jsx   # AI suggestions table (generate, apply, review, paginate, filter)
│       │   ├── MarketsGrid.jsx        # Market grid (accepts markets prop from parent)
│       │   ├── MarketCard.jsx         # Individual market card (dynamic colors, formatted numbers)
│       │   └── ScoreGauge.jsx         # Score gauge visualization (unused — dashboard has inline SVG)
│       │
│       └── campaigns/
│           ├── mockData.js            # 24 realistic campaign suggestion mock data
│           └── CampaignCard.jsx       # Campaign card component (WIP)
```

---

## 4. Architecture: Two Backend Systems

The project has TWO backend systems:

### A. Express Server (port 5000)
- **Used for:** Campaign generation, Suggestion generation (AI-powered)
- **Runs:** `node server.js` in a separate terminal
- **Auth:** None (CORS open)
- **Prisma client:** `lib/prisma.js`
- **Routes:** `/api/campaigns/*`, `/api/suggestions/*`

### B. Shopify Route Loaders (inside Vite/React Router)
- **Used for:** Dashboard data (markets, analytics), Shopify API integration
- **Runs:** Inside `npm run dev` (Shopify app dev server)
- **Auth:** `authenticate.admin(request)` — Shopify-authenticated
- **Prisma client:** `app/db.server.js`
- **Routes:** `app._index.jsx` (loader/action), `app.api.markets.jsx`, `app.api.sync.jsx`

> **WHY TWO?** The dashboard needs authenticated Shopify API access (markets, orders, translations), which only works inside Shopify's React Router framework. The Express server handles AI generation calls that don't need Shopify auth.

---

## 5. Database Schema (Prisma)

### Session (Shopify auth — DO NOT MODIFY)
Standard Shopify session model with refresh tokens.

### GeneratedCampaign (legacy — used by app.campaigns.jsx action)
```prisma
model GeneratedCampaign {
  id, template, customPrompt, title, content, market, createdAt
}
```

### Campaign (used by Express Campaign API)
```prisma
model Campaign {
  id, title, market, productType, goal, tone, platform, generatedContent, createdAt
}
```

### Suggestion (used by Express Suggestion API)
```prisma
model Suggestion {
  id, market, flag, tone, currentHeadline, currentDetail,
  suggestedHeadline, expectedLift, confidence, color, status, createdAt
}
```

### Market ⭐ NEW (used by Dashboard)
```prisma
model Market {
  id                String      @id @default(cuid())
  shopifyMarketId   String?     @unique    // Shopify GID
  country           String                  // "India", "USA"
  countryCode       String                  // "IN", "US"
  region            String                  // "South Asia"
  flag              String      @default("🌐")
  currency          String      @default("USD")
  language          String      @default("en")
  visitors          Int         @default(0)
  orders            Int         @default(0)
  revenue           Float       @default(0)
  conversionRate    Float       @default(0)
  localizationScore Int         @default(0)
  translatedItems   Int         @default(0)
  trend             Float       @default(0)
  isActive          Boolean     @default(true)
  shop              String
  createdAt, updatedAt

  translations      Translation[]
  analytics         Analytics[]
  campaigns         MarketCampaign[]

  @@unique([shop, countryCode])    // Compound key — used as shop_countryCode in Prisma
}
```

### Translation ⭐ NEW
```prisma
model Translation {
  id, marketId (→Market), productId, resourceType, key,
  originalText, translatedText, language, aiGenerated, createdAt
}
```

### Analytics ⭐ NEW
```prisma
model Analytics {
  id, marketId (→Market), visitors, orders, revenue, conversionRate, date, createdAt
  @@unique([marketId, date])
}
```

### MarketCampaign ⭐ NEW
```prisma
model MarketCampaign {
  id, marketId (→Market), title, content, performanceScore, status, createdAt
}
```

---

## 6. API Endpoints

### Express Server (port 5000)

#### Campaign APIs (`/api/campaigns`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/campaigns/generate` | Generate AI campaign + save to DB |
| `GET` | `/api/campaigns` | Fetch all campaigns |
| `GET` | `/api/campaigns/:id` | Fetch single campaign |
| `DELETE` | `/api/campaigns/:id` | Delete campaign |

#### Suggestion APIs (`/api/suggestions`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/suggestions` | Fetch all suggestions |
| `POST` | `/api/suggestions/generate` | Generate AI suggestion + save |
| `POST` | `/api/suggestions/apply/:id` | Mark as "applied" |
| `PATCH` | `/api/suggestions/review/:id` | Mark as "under_review" |
| `POST` | `/api/suggestions/regenerate/:id` | Regenerate AI for existing row |
| `POST` | `/api/suggestions/apply-all` | Apply all pending suggestions |
| `DELETE` | `/api/suggestions/:id` | Delete suggestion |

### Shopify Route Actions (authenticated)

#### Dashboard (`app._index.jsx`)
- **Loader:** Fetches markets from DB, seeds defaults if empty, calculates stats
- **Action (intent: addMarket):** Creates new Market record

#### Markets API (`app.api.markets.jsx`)
| Method | Description |
|---|---|
| `POST` | Create market (body: { country, countryCode, region, flag, currency, language }) |
| `PUT` | Update market (body: { id, ...fields }) |
| `DELETE` | Delete market (body: { id }) |

#### Sync API (`app.api.sync.jsx`)
| Method | Description |
|---|---|
| `POST` | Pulls fresh data from Shopify (orders, markets, translations), updates DB |

---

## 7. Shopify API Service Layer (`app/services/shopifyApi.server.js`)

All functions accept authenticated `admin` client:

| Function | What it fetches | Shopify Scope |
|---|---|---|
| `fetchShopifyMarkets(admin)` | Markets with web presence, locales, currencies | `read_markets` |
| `fetchShopLocales(admin)` | Shop locale settings | `read_locales` |
| `fetchTranslatableProducts(admin, first)` | Translatable product resources | `read_translations` |
| `fetchProductTranslations(admin, resourceId, locale)` | Translations for specific product | `read_translations` |
| `fetchRecentOrders(admin, first)` | Recent orders with billing address | `read_orders` |
| `fetchSalesByCountry(admin, days)` | ShopifyQL: sales by billing_country | `read_reports` |
| `fetchShopCurrencies(admin)` | Enabled currencies | (default) |

---

## 8. Scoring Utilities (`app/services/scoring.js`)

| Function | Returns |
|---|---|
| `calculateLocalizationScore({...})` | 0-100 score (weighted: translations 40%, currency 20%, language 20%, campaigns 10%, conversion 10%) |
| `calculateConversionRate(orders, visitors)` | Conversion rate % |
| `calculateTrend(current, previous)` | % change |
| `getScoreBadgeColor(score)` | Tailwind badge classes (green ≥80, yellow ≥60, red <60) |
| `getProgressBarColor(score)` | Tailwind bg class |

---

## 9. Dashboard Component Architecture

```
app._index.jsx (loader → markets, stats)
├── Header.jsx (onAddMarket, onPeriodChange, syncing)
├── Hero Banner (dynamic stats from loader)
│   ├── Localized Experience Score (stats.totalScore)
│   ├── SVG Gauge (needle angle computed from score)
│   ├── Active Markets count
│   ├── Avg Conversion Lift
│   └── Total Content Translated
├── Add Market Modal (20 preset countries, useFetcher for submission)
└── MarketsGrid (markets prop)
    └── MarketCard (market prop)
        ├── Flag emoji + Country name + Region
        ├── Score badge (dynamic color)
        ├── Visitors (formatted)
        ├── Conversion Rate + Trend
        ├── Localization Score /100
        ├── Progress bar (dynamic color)
        └── View Details → button
```

---

## 10. Environment Variables

File: `.env` (root of project)

```env
SHOPIFY_API_KEY=<shopify-api-key>
SHOPIFY_API_SECRET=<shopify-secret>
SCOPES=write_products,write_metaobjects,write_metaobject_definitions,read_locales,read_markets,read_translations,write_translations,read_orders,read_reports
DATABASE_URL="postgresql://<user>:<pass>@<host>/<db>?sslmode=require"
OPENROUTER_API_KEY=sk-or-v1-<your-key>
PORT=5000
```

---

## 11. How to Run

### Terminal 1 — Shopify Frontend (must start FIRST)
```bash
npm run dev
```

### Terminal 2 — Express Backend (start AFTER frontend)
```bash
node server.js
```

> ⚠️ **IMPORTANT (Windows):** Always start `npm run dev` BEFORE `node server.js`. If the backend is running first, `prisma generate` will fail with an EPERM error.

### Database Commands
```bash
npx prisma generate          # Regenerate Prisma client
npx prisma migrate dev       # Create + apply new migration
npx prisma db push           # Push schema without migration
npx prisma studio            # Open visual DB browser
node prisma/seed.js          # Seed default markets + analytics
```

---

## 12. Routing (React Router 7 — File-based)

| URL Path | Route File | Type | Component/Function |
|---|---|---|---|
| `/app` | `app._index.jsx` | Page | Dashboard (loader + action + Add Market) |
| `/app/campaigns` | `app.campaigns.jsx` | Page | CampaignGenerator |
| `/app/suggestions` | `app.suggestions.jsx` | Page | SuggestionsTable |
| `/app/additional` | `app.additional.jsx` | Page | Additional info |
| `/app/api/markets` | `app.api.markets.jsx` | API | Market CRUD (no UI) |
| `/app/api/sync` | `app.api.sync.jsx` | API | Shopify data sync (no UI) |

---

## 13. Known Patterns & Rules

1. **ES Modules** — All files use `import/export`, not `require()`.
2. **Two Prisma Clients** — `app/db.server.js` for Shopify routes, `lib/prisma.js` for Express server. DO NOT mix them.
3. **Compound Unique Key** — Market uses `@@unique([shop, countryCode])`. In Prisma queries use `shop_countryCode: { shop, countryCode }`.
4. **Per-card loading** — CampaignGenerator uses `loadingKey` (string) not a boolean.
5. **Pointer-events-none** — Non-active cards use CSS `pointer-events-none`, NOT `disabled` attribute.
6. **Server-only files** — Files ending in `.server.js` run ONLY on the server side in React Router. Never import them in client components.
7. **Shopify embedded** — The app runs inside Shopify admin iframe via App Bridge.
8. **dashboardData.js** — Now exports ONLY `campaigns` array. Markets and suggestions come from the database.
9. **Add Market** — Uses `useFetcher` with formData `intent: "addMarket"` and `countryCode` field.
10. **Sync** — Posts to `/app/api/sync` to pull fresh data from Shopify and recalculate scores.

---

## 14. What Has Been Built (Completed)

- [x] Express backend with campaign & suggestion routes
- [x] Prisma schema with 8 models
- [x] 4 database migrations applied to Neon PostgreSQL
- [x] Seed script (4 markets + 120 analytics records)
- [x] OpenRouter AI integration for campaigns (markdown) and suggestions (JSON)
- [x] Campaign Generator — 3 preset cards + custom form + per-card loading
- [x] CampaignResult — Beautiful parsed markdown → styled section cards
- [x] AI Suggestions Table — 20 preset countries, custom generation, pagination, filter, per-row actions
- [x] Dynamic Dashboard — loader-based, DB-driven market cards + hero stats
- [x] Add Market modal — 20 preset countries
- [x] Shopify API service layer — 7 GraphQL query functions
- [x] Scoring utilities — localization score, conversion rate, trend calculators
- [x] Market CRUD API route
- [x] Shopify sync API route
- [x] Functional Header buttons (Add Market, Sync/Period filter)
- [x] Theme App Extension language switcher (`extensions/language-switcher`) using client-side Google Translate triggers and custom dropdown widget with active state synchronization (`goog-te-combo`)
- [x] Official Vercel deployment integration using the `@vercel/react-router` preset, removing custom API wrappers and implementing secure cookie/localStorage redirect fallbacks for embedded iframe stability.

---

## 15. What Can Be Built Next (Ideas)

- [ ] Campaign history page — list all past generated campaigns from DB
- [ ] Market detail page — per-market analytics, translations, campaigns
- [ ] Full Campaign Suggestions system (CampaignGrid, CampaignFilters, CampaignPagination)
- [ ] AI-powered translation generation for products
- [ ] Export campaigns as PDF
- [ ] Analytics charts (line charts, bar charts for trends)
- [ ] A/B testing functionality for headlines
- [ ] Scheduled campaign publishing
- [ ] Webhook integration for Shopify order events
- [ ] Rate limiting on AI API calls

---

## 16. Troubleshooting

| Issue | Solution |
|---|---|
| `EPERM: operation not permitted` on prisma generate | Kill all `node.exe` processes first, then run `npx prisma generate` |
| Backend not reachable from frontend | Make sure `node server.js` is running in a separate terminal |
| Import path errors (`../../utils/api.js`) | From `app/components/dashboard/`, the correct path is `../../../utils/api.js` (3 levels up to root) |
| All buttons showing "Generating..." | Use `loadingKey` (string per card), not a shared `loading` boolean |
| Buttons fading when another card loads | Use `pointer-events-none` CSS class, NOT `disabled` attribute |
| Dashboard shows no markets | Run `node prisma/seed.js` to populate default data |
| Prisma `shop_countryCode` error | Make sure schema has `@@unique([shop, countryCode])` not `@@unique([country, shop])` |
| Shopify API 403 errors | Check that scopes in `shopify.app.toml` include `read_markets,read_orders,read_translations,read_reports` |

---

*This file should be read by any AI model before working on this project. It contains all architectural decisions, file locations, API contracts, and known patterns.*
