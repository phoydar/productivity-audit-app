FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p data && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts/migrate.mjs ./scripts/migrate.mjs

# Copy @libsql/client and its transitive deps for migrate.mjs
# (not included in Next.js standalone bundle)
COPY --from=deps /app/node_modules/@libsql ./node_modules/@libsql
COPY --from=deps /app/node_modules/libsql ./node_modules/libsql
COPY --from=deps /app/node_modules/js-base64 ./node_modules/js-base64

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD sh -c "node scripts/migrate.mjs && node server.js"
