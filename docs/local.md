# Local Development

How to run the monorepo on your machine for development.

## Prerequisites

- **Node.js** 18 or later
- **pnpm** 9

## Install dependencies

From the monorepo root:

```bash
cd monorepo
pnpm install
```

## Start both apps

```bash
pnpm dev
```

This starts:

| App    | URL                   | Notes                           |
|--------|-----------------------|---------------------------------|
| Client | http://localhost:5173 | Vite dev server with hot reload |
| Server | http://localhost:3000 | NestJS API in watch mode        |

The client proxies `/api` requests to the server during development.

## Run a single app

```bash
# Client only
pnpm --filter client dev

# Server only
pnpm --filter server dev
```

## Verify it works

- **Frontend:** open http://localhost:5173
- **API:** `curl http://localhost:3000/api` → returns `Hello World!`

## Useful commands

| Command        | Description                    |
|----------------|--------------------------------|
| `pnpm dev`     | Run client and server together |
| `pnpm lint`    | Lint all apps                  |
| `pnpm format`  | Format code with Prettier      |

## Troubleshooting

**Port already in use**

Stop the process using the port, or run the server on a different port:

```bash
PORT=4000 pnpm --filter server dev
```

**Client cannot reach the API**

Make sure the server is running on port 3000. The Vite dev server proxies `/api` to `http://localhost:3000`.
