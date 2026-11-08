# Meros web app. Multi stage build producing a Next.js standalone server.
# Not used for local development yet (Docker is not installed); kept ready for `docker compose up`
# and for Azure Container Apps.

FROM node:24-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 BUILD_STANDALONE=1
RUN pnpm prisma generate && pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S meros && adduser -S meros -G meros
COPY --from=build /app/public ./public
COPY --from=build --chown=meros:meros /app/.next/standalone ./
COPY --from=build --chown=meros:meros /app/.next/static ./.next/static
COPY --from=build /app/prisma ./prisma
USER meros
EXPOSE 3000
CMD ["node", "server.js"]
