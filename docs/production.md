# Production Build

How to build and run the app in production mode locally (without Docker).

## Prerequisites

- **Node.js** 18 or later
- **pnpm** 9

## Build

From the monorepo root:

```bash
pnpm install
pnpm build
```

This will:

1. Build the client → `apps/client/dist`
2. Build the server → `apps/server/dist`
3. Copy the client build into `apps/server/public`

Turbo ensures the client is built before the server.

## Start the production server

```bash
pnpm start:prod
```

Open http://localhost:3000. The server serves:

- **Frontend** at `/`
- **API** at `/api`

## Build or run individual apps

```bash
# Build client only
pnpm --filter client build

# Build server only (client must be built first)
pnpm --filter server build

# Start server in production mode
pnpm --filter server start:prod
```

## Environment variables

| Variable   | Default | Description        |
|------------|---------|--------------------|
| `PORT`     | `3000`  | Server listen port |
| `NODE_ENV` | —       | Set to `production` for prod runs |

Example:

```bash
PORT=4000 pnpm start:prod
```

## Troubleshooting

**Client build missing when starting server**

Always run `pnpm build` from the root before `pnpm start:prod`. The server copies the client build into `apps/server/public` during its build step.

**API works but frontend shows 404**

Run the full root build (`pnpm build`), not just `pnpm --filter server build`, so client assets are copied into `apps/server/public`.
