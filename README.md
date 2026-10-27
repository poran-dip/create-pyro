# Create Pyro

Scaffold a new Pyro monorepo: a Hono api and a React Router web app with shared, typed packages, Postgres via Drizzle and auth via Better Auth.

## Usage

```bash
pnpm create pyro
# or
npx create-pyro@latest

# With a project name
pnpm create pyro my-app

# Scaffold into the current directory (must be empty, or hold only .git)
pnpm create pyro .
```

The CLI asks for anything you don't pass as a flag:

| Flag                         | Default      | What it does                                    |
| ---------------------------- | ------------ | ----------------------------------------------- |
| `--scope <name>`             | project name | Scope for workspace packages (`@name/api`, ...) |
| `--git` / `--no-git`         | yes          | `git init` with an initial commit               |
| `--install` / `--no-install` | yes          | Run `pnpm install`                              |
| `-y`, `--yes`                |              | Accept defaults for anything not set by a flag  |

It also writes a `.env` with freshly generated secrets, so the project runs without any manual setup.

## What you get

```
apps/
  api/        Hono + Better Auth (email and password), Node server
  web/        React Router 8 with SSR, Tailwind CSS 4, typed api client
packages/
  config/     Zod-validated environment, split into lazily-checked scopes
  db/         Drizzle schema, client and migrations for Postgres
  shared/     Types and Zod schemas shared by both apps
infra/nginx/  Reverse proxy for the production stack
```

Plus pnpm workspaces with a dependency catalog, Turborepo, Biome, tsdown, Vitest, dotenv-run, Docker Compose files for development and production, and a GitHub Actions workflow.

The web app has a homepage with sign-in and sign-up, and a dashboard that shows the signed-in user and redirects to the homepage otherwise.

## Requirements

- Node.js 24+
- pnpm 12+
- Docker, for Postgres in development and for the production stack

## Development

```bash
git clone https://github.com/poran-dip/create-pyro.git
cd create-pyro
pnpm install
pnpm build
pnpm test
```

The template lives in `template/`. It uses `@repo/` as its package scope and `my-pyro-app` as its name; the CLI replaces both in every file. CI scaffolds a project from it and runs that project's lint, typecheck, tests and build, then brings up the production compose stack.

## Issues

Found a bug or have a feature request? [Open an issue](https://github.com/poran-dip/create-pyro/issues).

## License

[Apache-2.0](./LICENSE)
