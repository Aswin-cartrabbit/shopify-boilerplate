# Deploy

How to deploy the app using Docker. One container serves both the API and the frontend — you do not need separate deployments for client and server.

## Prerequisites

- **Docker**
- **Docker Compose**

## Build and run

From the monorepo root:

```bash
docker compose up --build
```

The app is available at http://localhost:3000.

## Run in the background

```bash
docker compose up --build -d
```

## Stop the container

```bash
docker compose down
```

## What the Docker build does

1. Installs dependencies with pnpm
2. Runs `pnpm build` (client + server)
3. Copies the server build and static client assets into a slim production image
4. Starts the NestJS server, which serves:
   - **Frontend** at `/`
   - **API** at `/api`

## Environment variables

Configure in `docker-compose.yml`:

| Variable   | Default      | Description        |
|------------|--------------|--------------------|
| `PORT`     | `3000`       | Server listen port |
| `NODE_ENV` | `production` | Runtime environment |

Example override:

```yaml
services:
  app:
    environment:
      PORT: 4000
```

## Deploy to a remote server

1. Copy the monorepo to your server (or clone from git).
2. Install Docker and Docker Compose on the server.
3. Run:

```bash
docker compose up --build -d
```

4. Put a reverse proxy (nginx, Caddy, etc.) in front of port 3000 if needed for HTTPS or a custom domain.

## Troubleshooting

**Build fails during `pnpm install`**

Make sure `pnpm-lock.yaml` is committed and up to date. Run `pnpm install` locally before deploying.

**Container starts but frontend is missing**

The Docker build runs the full `pnpm build` pipeline. Rebuild without cache:

```bash
docker compose build --no-cache
docker compose up -d
```

**Port conflict**

Change the host port in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"
```
