FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static /app/.next/static
COPY --from=builder /app/public /app/public
COPY --from=builder /app/scripts /app/scripts
COPY --from=builder /app/node_modules/pg /app/node_modules/pg
COPY --from=builder /app/node_modules/pg-pool /app/node_modules/pg-pool
COPY --from=builder /app/node_modules/pg-protocol /app/node_modules/pg-protocol
COPY --from=builder /app/node_modules/pg-types /app/node_modules/pg-types
COPY --from=builder /app/node_modules/pgpass /app/node_modules/pgpass

WORKDIR /app
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.js"]
