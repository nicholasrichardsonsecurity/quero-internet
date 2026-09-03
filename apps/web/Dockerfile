FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages packages
RUN pnpm install --frozen-lockfile

COPY apps/web apps/web
RUN pnpm --filter @quero-internet/web build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3401
ENV HOSTNAME=0.0.0.0

RUN corepack enable

COPY --from=build /app /app
EXPOSE 3401
CMD ["pnpm", "--filter", "@quero-internet/web", "start"]
