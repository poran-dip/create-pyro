FROM node:24-alpine AS builder
WORKDIR /app

# Vite resolves the root tsconfig's project references, so the tsconfigs of
# workspaces this image doesn't build (api, db) still need to be present.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY apps/api/package.json apps/api/tsconfig.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json packages/db/tsconfig.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

RUN corepack enable && pnpm install --frozen-lockfile --filter @repo/web...

COPY apps/web ./apps/web
COPY packages/config ./packages/config
COPY packages/shared ./packages/shared

# @repo/api is a types-only devDependency; the bundler drops those imports,
# so the api itself doesn't need building here.
RUN pnpm --filter @repo/config --filter @repo/shared --filter @repo/web build

FROM node:24-alpine
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/config/package.json ./packages/config/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

RUN corepack enable && pnpm install --frozen-lockfile --filter @repo/web... --prod

COPY --from=builder /app/packages/config/dist ./packages/config/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

USER node
WORKDIR /app/apps/web

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node_modules/.bin/react-router-serve", "dist/server/index.js"]
