# Monorepo

Turborepo monorepo with a React (Vite) client and NestJS server. In production, the server serves the built client so you only deploy one container.

See [docs/](./docs/) for guides:

- [Local development](./docs/local.md)
- [Production build](./docs/production.md)
- [Deploy](./docs/deploy.md)

## Structure

```
apps/
  client/   # React + Vite frontend
  server/   # NestJS API + static file server
```

## Development

```bash
pnpm install
pnpm dev
```

- Client: http://localhost:5173 (proxies `/api` to the server)
- Server: http://localhost:3000

## Production build

```bash
pnpm build
pnpm start:prod
```

The server build copies the client `dist` into `apps/server/public` and serves it at `/`. API routes live under `/api`.

## Docker

```bash
docker compose up --build
```

Open http://localhost:3000 — one container serves both the API and the React app.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Run client and server in watch mode |
| `pnpm build` | Build client, then server (with static assets) |
| `pnpm start:prod` | Start the production server |
| `pnpm lint` | Lint all apps |
# shopify-boilerplate
