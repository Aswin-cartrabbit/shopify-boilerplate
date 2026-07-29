# Getting started

Welcome. This repository is a **pnpm + Turborepo** monorepo for a **Shopify embedded app**: a **NestJS** API (`apps/server`) and a **React + Vite** admin UI (`apps/client`). The server serves JSON under `/api/*` and, in production, the built client from `apps/server/public`.

Use this guide for local setup, day-to-day development, and the patterns we expect in new code.

---

## Prerequisites

| Tool | Version / notes |
|------|------------------|
| **Node.js** | `>= 18` (CI uses 20) |
| **pnpm** | `9.x` (`corepack enable` then `corepack prepare pnpm@9.0.0 --activate`) |
| **Docker** | For local Postgres (`pnpm db:up`) |
| **Shopify Partner account** | App with API key, secret, and redirect URL pointing at your tunnel or `HOST` |

---

## Repository layout

```
monorepo/
├── apps/
│   ├── client/          # React UI (Vite, Polaris web components)
│   └── server/          # NestJS API, Prisma, Shopify OAuth & webhooks
├── docs/                # Team docs (this file)
├── eslint.config.mjs    # Root ESLint (client + server)
├── eslint-rules/        # Shared quality rules (JSDoc, max-lines, naming)
├── turbo.json           # Task graph (build, dev, lint)
└── docker-compose.local.yml
```

**Important paths**

| Path | Purpose |
|------|---------|
| `apps/server/src/shopify/` | OAuth, shop persistence, webhooks |
| `apps/server/src/shopify/types/` | API and domain types (source of truth) |
| `apps/client/src/lib/shopify.ts` | Browser calls to `/api/*` |
| `apps/client/src/hooks/useShopifyAuth.ts` | Auth state for the app shell |

The client reuses **wire-format types** from the server via the TypeScript path alias `@server/api-wire` (type-only imports; no runtime dependency).

---

## First-time setup

Run these from the **repository root**.

### 1. Install dependencies

```bash
pnpm install
```

### 2. Start Postgres

```bash
pnpm db:up
```

Default connection string (also in `apps/server/.env.example`):

```text
postgresql://postgres:postgres@localhost:5432/app?schema=public
```

### 3. Configure environment

```bash
cp apps/server/.env.example apps/server/.env
cp apps/client/.env.example apps/client/.env
```

Fill in at least:

- **`apps/server/.env`** — `DATABASE_URL`, `HOST` (public app URL, e.g. ngrok or `http://localhost:3000`), `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SCOPES`
- **`apps/client/.env`** — `VITE_SHOPIFY_API_KEY` (same API key as the server)

`HOST` must match what you configure in the Shopify Partner Dashboard (App URL, allowed redirection URLs, etc.).

### 4. Apply the database schema

```bash
pnpm --filter server db:migrate
# or, for a quick local sync without migration history:
# pnpm --filter server db:push
```

### 5. Verify lint and build

```bash
pnpm lint
pnpm build
```

---

## Daily development

You typically run **two processes**: the API on port **3000** and the Vite dev server (default **5173**). Vite proxies `/api` to the Nest app so the browser can call the API without CORS setup.

```bash
# Terminal 1 — API with hot reload
pnpm --filter server dev

# Terminal 2 — React UI with HMR
pnpm --filter client dev
```

Open the app URL from Shopify Admin (embedded) or use your tunnel URL with `?shop=your-store.myshopify.com`.

**Alternative:** run everything through Turbo (starts both apps):

```bash
pnpm dev
```

### Production-like static UI

To serve the UI the same way as production (built files in `apps/server/public`):

```bash
pnpm dev:static
```

The client build is copied into `apps/server/public` after each Vite bundle. Useful when debugging App Bridge or embedded-only behavior.

---

## How the pieces connect

```mermaid
flowchart LR
  subgraph browser [Browser]
    UI[React client]
  end
  subgraph dev [Local dev]
    Vite[Vite :5173]
    Nest[Nest :3000]
    DB[(Postgres)]
  end
  Shopify[Shopify Admin / OAuth]

  UI --> Vite
  Vite -->|proxy /api| Nest
  Nest --> DB
  Shopify -->|OAuth / webhooks| Nest
  UI -->|App Bridge JWT| Nest
```

**Auth (short version)**

1. **Embedded** — Client reads `shop` + `host` from the URL, gets a session token from App Bridge, then `POST /api/auth/session`.
2. **Not embedded** — Client calls `GET /api/shop/status`; if not installed, redirects to `GET /api/auth?shop=…` for OAuth.

---

## Code conventions

We enforce quality at **commit time** (Husky + lint-staged) and in **CI** (`.github/workflows/lint.yml`).

| Rule | Where |
|------|--------|
| Run `pnpm lint` (zero warnings) | Root |
| JSDoc on functions/methods (`@param`, `@returns` with `{Type}`) | `eslint-rules/quality.mjs` |
| Explicit TypeScript return types on public APIs | Team practice + IDE |
| No `any`, no vague names like `data` / `temp` | ESLint |
| Keep files under **800** effective lines | ESLint `max-lines` |

**Types**

- JSON response shapes: `apps/server/src/shopify/types/shop-api.types.ts`, `auth-api.types.ts`
- Client imports: `import type { … } from '@server/api-wire'`
- Server services/controllers: `import type { … } from './types'` (or module-relative path)

**Formatting**

```bash
pnpm format
```

---

## Example: add a read-only API field (end-to-end pattern)

This mirrors how **`GET /api/shop/status`** works today. Adapt the names when you add your own feature.

### Step 1 — Extend the shared type (server)

In `apps/server/src/shopify/types/shop-api.types.ts`, add a field to `ShopSummary` if the JSON response should expose it:

```typescript
export type ShopSummary = {
  domain: string;
  name: string | null;
  status: string;
  installedAt: string | null;
  uninstalledAt: string | null;
  // plan: string | null;  // example new field
};
```

Re-export stays automatic via `api-wire.types.ts` for the client.

### Step 2 — Return it from the controller (server)

In `apps/server/src/shopify/shop.controller.ts`, map the Prisma row to the DTO (ISO strings for dates):

```typescript
return {
  installed: true,
  shop: {
    domain: shopRecord.shopDomain,
    name: shopRecord.name,
    status: shopRecord.status,
    installedAt: shopRecord.installedAt?.toISOString() ?? null,
    uninstalledAt: shopRecord.uninstalledAt?.toISOString() ?? null,
    // plan: shopRecord.plan,
  },
};
```

Add JSDoc and an explicit return type: `Promise<ShopStatusApiResponse>`.

### Step 3 — Consume it in the client (optional)

In `apps/client/src/lib/shopify.ts`, `fetchShopStatus` already types the response as `ShopStatusApiResponse`. After you extend the type, TypeScript will guide UI usage:

```typescript
const status = await fetchShopStatus(shop);
if (status.installed) {
  console.log(status.shop.domain, status.shop.name);
}
```

### Step 4 — Check your work

```bash
pnpm lint
pnpm --filter server build
pnpm --filter client build
```

---

## Commands cheat sheet

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm dev` | Run `dev` in all apps (Turbo) |
| `pnpm dev:static` | Build/watch client into `server/public` + server dev |
| `pnpm build` | Production build (client first, then server) |
| `pnpm lint` | ESLint entire repo |
| `pnpm lint:apps` | Lint via Turbo per package |
| `pnpm format` | Prettier on TS/TSX/MD |
| `pnpm db:up` / `pnpm db:down` | Start/stop local Postgres |
| `pnpm --filter server db:migrate` | Prisma migrate dev |
| `pnpm --filter server db:studio` | Prisma Studio |
| `pnpm start:prod` | Run compiled server (`server/dist`) |

Filter any script to one app:

```bash
pnpm --filter client dev
pnpm --filter server test
```

---

## Before you open a pull request

1. `pnpm lint` passes locally (pre-commit runs ESLint on staged `.ts` / `.tsx` files).
2. New functions include JSDoc with typed `@param` and `@returns`.
3. API changes update types under `apps/server/src/shopify/types/` (and client `@server/api-wire` imports if needed).
4. Do not commit secrets — keep `.env` local; use `.env.example` for documentation.

---

## Troubleshooting

| Symptom | Things to check |
|---------|------------------|
| OAuth redirect mismatch | `HOST` in `apps/server/.env` matches Partner Dashboard URLs |
| API 404 from Vite | Server running on `:3000`; proxy in `apps/client/vite.config.ts` |
| Database connection errors | `pnpm db:up`, `DATABASE_URL`, migrations applied |
| `pnpm` version errors | `corepack prepare pnpm@9.0.0 --activate` |
| Embedded auth fails | `VITE_SHOPIFY_API_KEY` set; open app from Shopify Admin |

If you are stuck, trace an existing flow (`shop.controller.ts` → `auth.service.ts` → `shop.service.ts` on the server; `useShopifyAuth` → `lib/shopify.ts` on the client) and copy that structure.
