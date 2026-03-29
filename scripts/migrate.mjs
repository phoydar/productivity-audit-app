/**
 * Lightweight startup migration — creates tables if they don't exist.
 * Runs before the Next.js server starts in production.
 * No dependency on drizzle-kit in the production image.
 */
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

const tables = [
  `CREATE TABLE IF NOT EXISTS daily_log (
    id TEXT PRIMARY KEY,
    log_date TEXT NOT NULL UNIQUE,
    summary TEXT,
    observations TEXT,
    total_deep_work DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_shallow_work DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_interruptions DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_meetings DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_personal_misc DOUBLE PRECISION NOT NULL DEFAULT 0,
    is_reconstructed BOOLEAN NOT NULL DEFAULT FALSE,
    generated_at TEXT,
    created_at TEXT NOT NULL DEFAULT now()::TEXT,
    updated_at TEXT NOT NULL DEFAULT now()::TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS log_entry (
    id TEXT PRIMARY KEY,
    daily_log_id TEXT NOT NULL,
    task TEXT NOT NULL,
    outcome TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('DEEP_WORK','SHALLOW_WORK','MEETING','INTERRUPTION','PERSONAL_MISC')),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_reconstructed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TEXT NOT NULL DEFAULT now()::TEXT,
    updated_at TEXT NOT NULL DEFAULT now()::TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS tag (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT,
    created_at TEXT NOT NULL DEFAULT now()::TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS entry_tag (
    entry_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (entry_id, tag_id)
  )`,
  `CREATE TABLE IF NOT EXISTS insight (
    id TEXT PRIMARY KEY,
    insight_date TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('TREND','THRESHOLD','SUGGESTION')),
    message TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('INFO','WARNING')),
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT now()::TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS todo (
    id TEXT PRIMARY KEY,
    task TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('DEEP_WORK','SHALLOW_WORK','MEETING','INTERRUPTION','PERSONAL_MISC')),
    estimated_minutes INTEGER NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    tags TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','COMPLETED','CANCELLED')),
    completed_at TEXT,
    log_entry_id TEXT,
    created_at TEXT NOT NULL DEFAULT now()::TEXT,
    updated_at TEXT NOT NULL DEFAULT now()::TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
];

const indexes = [
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_log_date ON daily_log(log_date)`,
  `CREATE INDEX IF NOT EXISTS idx_entry_daily_log ON log_entry(daily_log_id)`,
  `CREATE INDEX IF NOT EXISTS idx_entry_category ON log_entry(category)`,
  `CREATE INDEX IF NOT EXISTS idx_entry_tag_entry ON entry_tag(entry_id)`,
  `CREATE INDEX IF NOT EXISTS idx_entry_tag_tag ON entry_tag(tag_id)`,
  `CREATE INDEX IF NOT EXISTS idx_insight_date ON insight(insight_date)`,
  `CREATE INDEX IF NOT EXISTS idx_todo_status ON todo(status)`,
  `CREATE INDEX IF NOT EXISTS idx_todo_created ON todo(created_at)`,
];

// Idempotent column additions for existing databases
const alterations = [
  `ALTER TABLE daily_log ADD COLUMN IF NOT EXISTS total_meetings DOUBLE PRECISION NOT NULL DEFAULT 0`,
];

async function migrate() {
  console.log('[migrate] Running startup migration...');
  await client.connect();
  for (const sql of [...tables, ...indexes]) {
    await client.query(sql);
  }
  for (const sql of alterations) {
    await client.query(sql);
  }
  await client.end();
  console.log('[migrate] All tables and indexes ready.');
}

migrate().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
