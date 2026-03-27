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
ENV NODE_ENV=production

# COPY destinations are relative to WORKDIR. Without WORKDIR, the node image
# defaults to /, so "./" was the filesystem root and server.js did not land
# under /app where CMD runs.
WORKDIR /app

# With turbopack.root above the app dir, standalone may nest server.js one
# level down; the folder name varies (e.g. "app" in Linux builds vs package
# name locally). Flatten so /app/server.js always exists.
COPY --from=builder /app/.next/standalone /tmp/standalone
RUN set -e; \
  if [ -f /tmp/standalone/server.js ]; then \
    cp -a /tmp/standalone/. /app/; \
  else \
    nested="$(find /tmp/standalone -mindepth 1 -maxdepth 1 -type d | head -n1)"; \
    cp -a "${nested}/." /app/; \
  fi; \
  rm -rf /tmp/standalone

COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN mkdir -p ./data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]