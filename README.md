# Create Pyro

Scaffold a new Pyro monorepo project.

> **Note:** The full monorepo template is still under development. See "What you get" below for current state.

## Usage

```bash
npx create-pyro@latest
# or
pnpm create pyro

# With a project name
pnpm create pyro my-app

# Scaffold into the current directory
pnpm create pyro .
```

## What you get

Currently scaffolds a minimal starter project (`package.json`, `.gitignore`). Planned for the full template:

- Turborepo
- Biome (lint + format)
- pnpm workspaces

## Requirements

- Node.js 24+
- pnpm 11+

## Development

```bash
git clone https://github.com/poran-dip/create-pyro.git
cd create-pyro
pnpm install
pnpm build
pnpm test
```

## Issues

Found a bug or have a feature request? [Open an issue](https://github.com/poran-dip/create-pyro/issues).

## License

[Apache-2.0](./LICENSE)
