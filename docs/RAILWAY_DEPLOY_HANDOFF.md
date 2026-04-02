# Railway Deploy Handoff — productivity-audit


## Status: BLOCKED on `server.js` not found at runtime

The Next.js build succeeds. The Docker image builds. But the container crashes on startup because `node server.js` can't find the file.

---

## What's Been Done

### 1. Build Error Fixed ✅
**Problem:** `next build` crashed with `TypeError: Cannot read properties of null (reading 'useContext')` during prerendering of `/_global-error`.

**Root cause:** Non-standard `NODE_ENV` in the shell environment conflicting with Next.js's internal prerender pipeline. The build literally warns: `⚠ You are using a non-standard "NODE_ENV" value in your environment.`

**Fix applied:** Changed build script in `package.json` to:
```json
"build": "NODE_ENV=production next build"
```

**Verified:** Build passes locally and in Docker (Turbopack, Next.js 16.2.1).

### 2. migrate.mjs Removed ✅
The startup migration script (`scripts/migrate.mjs`) was removed from the Dockerfile CMD because `@libsql/client` and its transitive dependencies (`promise-limit`, `js-base64`, `libsql`, etc.) aren't included in the Next.js standalone output bundle. Multiple approaches to include them failed:
- Cherry-picking `COPY --from=deps` for individual packages — missed transitive deps
- `npm install` in the runner stage — clobbered the standalone output's `package.json` and `node_modules`
- Installing in an isolated subdirectory with `NODE_PATH` — still failed to resolve

The `total_meetings` column already exists in the production DB from a previous local run. The `migrate.mjs` script itself has been updated with the MEETING category but is no longer used in Docker.

### 3. Meeting Category Added ✅
`MEETING` promoted from tag to first-class category across all layers — types, schema, validators, constants, 4 services, 7 UI components, migration script. All working locally.

### 4. Retroactive Activity Logging Added ✅
Date picker on QuickAdd (dashboard + day page), 30-day lookback window, server-side validation. Working locally.

### 5. Inline Entry Editing Added ✅
EntryCard supports inline edit mode with task, outcome, duration, and category editing. PATCH `/api/entries/[id]`. Working locally.

---

## Current Blocker: `server.js` Not Found

### Symptom
```
Error: Cannot find module '/app/server.js'
```
Container starts, but `node server.js` fails immediately.

### Likely Cause
The `turbopack.root` config in `next.config.ts` is set to `path.join(__dirname, "..")` (one directory above the project). This is **load-bearing** — removing it causes Turbopack to hang during CSS compilation (see `.auto-memory/feedback_turbopack_root.md`).

With `output: "standalone"`, Next.js generates the standalone bundle at `.next/standalone/`. When `turbopack.root` points to a parent directory, the standalone output **nests the project files** under a subdirectory matching the project's relative path from that root. So instead of:
```
.next/standalone/server.js
.next/standalone/node_modules/
```
It may be:
```
.next/standalone/app/server.js        # or productivity-audit/server.js
.next/standalone/app/node_modules/
```

### What to Investigate
A debug step was added to the Dockerfile (currently line 21):
```dockerfile
RUN echo "=== standalone contents ===" && ls -la && echo "=== searching for server.js ===" && find . -name "server.js" -maxdepth 3
```

**Check the Railway build logs for this output.** It will show exactly where `server.js` lives. Then:
1. Adjust the `COPY --from=builder` path to match the actual structure
2. Or adjust the `CMD` to point to the correct `server.js` path

### Current Dockerfile
```dockerfile
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
# Debug: show where server.js actually is in the standalone output
RUN echo "=== standalone contents ===" && ls -la && echo "=== searching for server.js ===" && find . -name "server.js" -maxdepth 3

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
```

---

## Key Config Context

### next.config.ts (do NOT modify turbopack.root)
```typescript
const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: path.join(__dirname, ".."),   // <-- load-bearing, causes CSS hang if removed
    ignoreIssue: [{ path: "**", description: /resolve 'tailwindcss'/ }]
  }
}
```

### Database
- SQLite via `@libsql/client` (Drizzle ORM)
- `DATABASE_URL` env var on Railway
- Railway volume mounted for persistent storage
- `total_meetings` column already exists in production DB

### Files Modified This Session
- `package.json` — build script, MEETING category
- `Dockerfile` — multiple iterations (see above for current)
- `src/app/global-error.tsx` — cleaned up, removed useless `force-dynamic`
- `src/types/index.ts` — MEETING in CategoryType
- `src/lib/db/schema.ts` — MEETING in enums, total_meetings column
- `src/lib/validators.ts` — MEETING in Zod schema
- `src/lib/constants.ts` — MEETING config entry
- `src/lib/services/log-service.ts` — MEETING in recalculate
- `src/lib/services/summary-service.ts` — MEETING in breakdown
- `src/lib/services/analytics-service.ts` — MEETING in weekly/trends
- `src/lib/services/insight-service.ts` — MEETING in avg total
- `src/components/dashboard/quick-add.tsx` — retroactive date picker, MEETING category
- `src/components/dashboard/todo-panel.tsx` — MEETING category
- `src/components/dashboard/week-overview.tsx` — MEETING in stacked bar
- `src/components/dashboard/today-status.tsx` — MEETING in total hours
- `src/components/day/entry-card.tsx` — inline editing, MEETING style
- `src/components/day/time-breakdown.tsx` — MEETING in donut chart
- `src/app/day/[date]/page.tsx` — QuickAdd integration, handleEdit, MEETING
- `src/app/api/logs/[date]/entries/route.ts` — retroactive validation
- `scripts/migrate.mjs` — MEETING category, total_meetings column + ALTER TABLE
