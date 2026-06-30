# Create Pyro

Scaffold a new Pyro monorepo project.

## Usage

```bash
npx create-pyro@latest
# or
pnpm create pyro
```

## Options

```bash
# Named argument skips the prompt
pnpm create pyro my-app
```

## What you get

A monorepo preconfigured with:

- Turborepo
- Biome (lint + format)
- pnpm workspaces

## Development

```bash
git clone https://github.com/poran-dip/create-pyro
cd create-pyro
pnpm install
pnpm build
pnpm test
```

## License

Apache-2.0
