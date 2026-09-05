FROM node:22-bookworm-slim AS build
WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages packages
RUN pnpm install --frozen-lockfile --prod=false

COPY apps/web apps/web
# Reify the filtered workspace explicitly; this prevents a partial root install
# from leaving apps/web/node_modules without the Next.js executable.
RUN pnpm --filter @quero-internet/web... install --frozen-lockfile --prod=false
RUN test -f apps/web/node_modules/next/dist/bin/next
RUN pnpm --filter @quero-internet/web build

FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3401
ENV HOSTNAME=0.0.0.0

RUN corepack enable && groupadd --system webapp && useradd --system --gid webapp webapp

COPY --from=build --chown=webapp:webapp /app /app
USER webapp

EXPOSE 3401
CMD ["node", "apps/web/node_modules/next/dist/bin/next", "start", "apps/web", "-p", "3401"]
