# my-pyro-app

A TypeScript monorepo: a Hono api and a React Router web app sharing typed packages, with Postgres via Drizzle and auth via Better Auth.

## Quick start

Requires Node.js 24+, pnpm 12+ and Docker.

```bash
pnpm install
docker compose -f compose.dev.yml up -d   # Postgres on localhost:15432
pnpm db:migrate
pnpm dev
```

Then open http://localhost:3000. The api runs on http://localhost:3002.

`.env` is gitignored, so a fresh clone needs one: copy `.env.example` to `.env` and set `BETTER_AUTH_SECRET` (`openssl rand -base64 32`).

## Layout

```
apps/
  api/        Hono server: Better Auth at /api/auth/*, your routes under /api
  web/        React Router (SSR) + Tailwind; calls the api with a typed client
packages/
  config/     Zod-validated env, split into lazily-checked scopes
  db/         Drizzle schema, client and migrations
  shared/     Types and Zod schemas used by both apps
infra/nginx/  Reverse proxy for the production compose stack
```

Packages build to `dist/` with tsdown. During `pnpm dev`, each package rebuilds on change and the apps pick it up.

## Scripts

| Script             | What it does                                   |
| ------------------ | ---------------------------------------------- |
| `pnpm dev`         | Run everything in watch mode                   |
| `pnpm build`       | Build all packages and apps                    |
| `pnpm typecheck`   | Typecheck every workspace                      |
| `pnpm test`        | Run every suite (the api suite needs Postgres) |
| `pnpm lint`        | Lint and format with Biome, applying fixes     |
| `pnpm db:generate` | Generate a migration from schema changes       |
| `pnpm db:migrate`  | Apply pending migrations                       |
| `pnpm db:push`     | Push the schema directly (prototyping only)    |
| `pnpm db:studio`   | Open Drizzle Studio                            |

## Environment

Every variable lives in the root `.env`; `.env.example` documents them. `packages/config` validates them per scope (`dbEnv`, `authEnv`, `apiEnv`, `webEnv`), so a process only needs the variables it reads, and a missing one fails with a message naming it.

The api tests run against a separate database: `DATABASE_URL` with `_test` appended to its name, created and migrated automatically. Set `TEST_DATABASE_URL` to use another one.

## Auth

Email and password sign-in is on by default. To add Google or another provider, add its credentials to `authSchema` in `packages/config`, then enable it under `socialProviders` in `apps/api/src/lib/auth.ts`.

## Production

```bash
docker compose up --build -d
```

This builds the images and starts Postgres, runs migrations once, then starts the api and web behind nginx on port 80. Set `PUBLIC_ORIGIN` to the URL you serve it on.

The Dockerfiles list each workspace's `package.json` explicitly, so when you add or remove an app or package, update the `COPY` lines in each Dockerfile.
