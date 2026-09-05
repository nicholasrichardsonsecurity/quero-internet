FROM node:22-bookworm-slim AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/worker/package.json apps/worker/package.json
COPY apps/worker apps/worker

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @quero-internet/worker build

FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/apps/worker/dist ./dist

USER node
CMD ["node", "dist/index.js"]
