# syntax=docker/dockerfile:1.7

FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /workspace

FROM base AS deps
RUN apt-get update -y && apt-get install -y --no-install-recommends \
  ca-certificates \
  openssl \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json /workspace/
COPY apps/api-server/package.json /workspace/apps/api-server/package.json
COPY apps/web/package.json /workspace/apps/web/package.json
COPY packages/config/package.json /workspace/packages/config/package.json
COPY packages/database/package.json /workspace/packages/database/package.json
COPY packages/shared/package.json /workspace/packages/shared/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM deps AS build
COPY apps /workspace/apps
COPY packages /workspace/packages
RUN pnpm --filter @repo/shared build
RUN pnpm --filter @repo/database db:generate
RUN pnpm --filter @repo/database build
RUN pnpm --filter @harness-kanban/web build

FROM node:20-slim AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app
COPY --from=build --chown=node:node /workspace/apps/web/.next-build/standalone /app
COPY --from=build --chown=node:node /workspace/apps/web/.next-build/static /app/apps/web/.next-build/static
COPY --from=build --chown=node:node /workspace/apps/web/public /app/apps/web/public
COPY --chown=node:node docker/web-entrypoint.sh /app/docker/web-entrypoint.sh
USER node
EXPOSE 3000
CMD ["sh", "/app/docker/web-entrypoint.sh"]
