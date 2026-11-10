# Meros web app. Multi stage build.
#   target "tools":  full source and dev dependencies, used by compose to migrate and seed
#   target "runner": small production image (Next.js standalone server), used by compose and Azure

FROM node:24-alpine AS base
RUN apk add --no-cache openssl libc6-compat \
 && corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma
RUN pnpm install --frozen-lockfile

# Migrations and demo seed (prisma CLI + tsx are dev dependencies).
FROM deps AS tools
COPY . .
CMD ["sh", "-c", "pnpm db:deploy && pnpm seed:if-empty"]

FROM deps AS build
COPY . .
ENV BUILD_STANDALONE=1
RUN pnpm prisma generate && pnpm build

FROM base AS runner
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -S meros && adduser -S meros -G meros
COPY --from=build /app/public ./public
COPY --from=build --chown=meros:meros /app/.next/standalone ./
COPY --from=build --chown=meros:meros /app/.next/static ./.next/static
USER meros
EXPOSE 3000
CMD ["node", "server.js"]
