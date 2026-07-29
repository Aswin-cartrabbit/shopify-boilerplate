# Documentation

| Guide | Description |
|-------|-------------|
| [Local Development](./local.md) | Run the app locally with hot reload |
| [Production Build](./production.md) | Build and run in production mode |
| [Deploy](./deploy.md) | Deploy with Docker |

## Project structure

```
monorepo/
├── apps/
│   ├── client/   # React + Vite frontend
│   └── server/   # NestJS API + static file server
├── docs/
├── Dockerfile
└── docker-compose.yml
```

In production and deployment, the server serves the built client from `apps/server/public`, so only one service needs to be deployed.
