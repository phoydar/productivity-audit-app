/**
 * Startup migration — creates tables, seeds system categories, and handles schema evolution.
 * Runs before the Next.js server starts in production.
 *
 * IMPORTANT ORDER: the PG enum type 'category' must be fully removed from all
 * columns BEFORE we create the new 'category' table, otherwise Postgres refuses
 * to drop the type citing a name-conflict dependency on the table.
 */
import pg from 'pg';

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

const SYSTEM_CATEGORIES = [
  { id: 'sys_high_focus',    name: 'High Focus',      color: '#2563eb', isFocusType: true,  sortOrder: 0 },
  { id: 'sys_medium',        name: 'Medium',           color: '#6366f1', isFocusType: false, sortOrder: 1 },
  { id: 'sys_low_focus',     name: 'Low Focus',        color: '#f59e0b', isFocusType: false, sortOrder: 2 },
  { id: 'sys_meeting',       name: 'Meeting',          color: '#0d9488', isFocusType: false, sortOrder: 3 },
  { id: 'sys_interruption',  name: 'Interruption',     color: '#ef4444', isFocusType: false, sortOrder: 4 },
  { id: 'sys_personal_misc', name: 'Personal / Misc',  color: '#8b5cf6', isFocusType: false, sortOrder: 5 },
];

async function migrate() {
  console.log('[migrate] Connecting...');
  await client.connect();
  console.log('[migrate] Running schema migrations...');

  // ── PHASE 1: Strip the old 'category' enum from existing tables ─────────────
  // Must happen BEFORE we create the new 'category' TABLE or drop the TYPE.

  // log_entry: add category_id (text), migrate data from enum column, drop enum column
  await client.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='log_entry') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name='log_entry' AND column_name='category_id') THEN
          ALTER TABLE log_entry ADD COLUMN category_id TEXT NOT NULL DEFAULT 'sys_high_focus';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='log_entry' AND column_name='category') THEN
          UPDATE log_entry SET category_id = CASE category::text
            WHEN 'HIGH_FOCUS'    THEN 'sys_high_focus'
            WHEN 'MEDIUM'        THEN 'sys_medium'
            WHEN 'LOW_FOCUS'     THEN 'sys_low_focus'
            WHEN 'MEETING'       THEN 'sys_meeting'
            WHEN 'INTERRUPTION'  THEN 'sys_interruption'
            WHEN 'PERSONAL_MISC' THEN 'sys_personal_misc'
            ELSE 'sys_high_focus'
          END;
          ALTER TABLE log_entry DROP COLUMN category;
        END IF;
      END IF;
    END $$
  `);

  // todo: same migration
  await client.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='todo') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name='todo' AND column_name='category_id') THEN
          ALTER TABLE todo ADD COLUMN category_id TEXT NOT NULL DEFAULT 'sys_high_focus';
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='todo' AND column_name='category') THEN
          UPDATE todo SET category_id = CASE category::text
            WHEN 'HIGH_FOCUS'    THEN 'sys_high_focus'
            WHEN 'MEDIUM'        THEN 'sys_medium'
            WHEN 'LOW_FOCUS'     THEN 'sys_low_focus'
            WHEN 'MEETING'       THEN 'sys_meeting'
            WHEN 'INTERRUPTION'  THEN 'sys_interruption'
            WHEN 'PERSONAL_MISC' THEN 'sys_personal_misc'
            ELSE 'sys_high_focus'
          END;
          ALTER TABLE todo DROP COLUMN category;
        END IF;
      END IF;
    END $$
  `);

  // ── PHASE 2: Drop the old PG enum type ─────────────────────────────────────
  // A previous failed migration may have already created the 'category' TABLE
  // while the 'category' TYPE still existed. Postgres won't drop the type while
  // the table exists (same name = catalog dependency). Drop the table first so
  // we can drop the type cleanly, then recreate the table in Phase 3.
  await client.query(`
    DO $$ BEGIN
      IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category') THEN
        -- Drop the category table if it was created by a previous partial run
        DROP TABLE IF EXISTS category;
        DROP TYPE category;
      END IF;
    END $$
  `);

  // ── PHASE 3: Create new 'category' TABLE (safe now that TYPE is gone) ──────
  await client.query(`
    CREATE TABLE IF NOT EXISTS category (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#6366f1',
      icon TEXT,
      is_focus_type BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT now()::TEXT
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_category_user ON category(user_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_category_sort ON category(sort_order)`);

  // ── PHASE 4: Seed system categories ────────────────────────────────────────
  for (const cat of SYSTEM_CATEGORIES) {
    await client.query(
      `INSERT INTO category (id, name, color, is_focus_type, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, color = EXCLUDED.color,
         is_focus_type = EXCLUDED.is_focus_type, sort_order = EXCLUDED.sort_order`,
      [cat.id, cat.name, cat.color, cat.isFocusType, cat.sortOrder]
    );
  }

  // ── PHASE 5: daily_log — remove legacy total_* columns ────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS daily_log (
      id TEXT PRIMARY KEY,
      log_date TEXT NOT NULL UNIQUE,
      summary TEXT,
      observations TEXT,
      is_reconstructed BOOLEAN NOT NULL DEFAULT FALSE,
      generated_at TEXT,
      created_at TEXT NOT NULL DEFAULT now()::TEXT,
      updated_at TEXT NOT NULL DEFAULT now()::TEXT
    )
  `);
  await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_log_date ON daily_log(log_date)`);

  await client.query(`
    DO $$ DECLARE col TEXT;
    BEGIN
      FOREACH col IN ARRAY ARRAY[
        'total_high_focus','total_medium','total_low_focus',
        'total_meetings','total_interruptions','total_personal_misc',
        'total_deep_work','total_shallow_work'
      ] LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name='daily_log' AND column_name=col) THEN
          EXECUTE 'ALTER TABLE daily_log DROP COLUMN ' || col;
        END IF;
      END LOOP;
    END $$
  `);

  // ── PHASE 6: log_entry — create if fresh, indexes always ───────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS log_entry (
      id TEXT PRIMARY KEY,
      daily_log_id TEXT NOT NULL,
      category_id TEXT NOT NULL DEFAULT 'sys_high_focus',
      task TEXT NOT NULL,
      outcome TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_reconstructed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TEXT NOT NULL DEFAULT now()::TEXT,
      updated_at TEXT NOT NULL DEFAULT now()::TEXT
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_entry_daily_log ON log_entry(daily_log_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_entry_category ON log_entry(category_id)`);

  // ── PHASE 7: todo — create if fresh ────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS todo (
      id TEXT PRIMARY KEY,
      task TEXT NOT NULL,
      category_id TEXT NOT NULL DEFAULT 'sys_high_focus',
      estimated_minutes INTEGER NOT NULL,
      priority INTEGER NOT NULL DEFAULT 0,
      tags TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','COMPLETED','CANCELLED')),
      completed_at TEXT,
      log_entry_id TEXT,
      created_at TEXT NOT NULL DEFAULT now()::TEXT,
      updated_at TEXT NOT NULL DEFAULT now()::TEXT
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_todo_status ON todo(status)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_todo_created ON todo(created_at)`);

  // ── PHASE 8: Remaining tables ───────────────────────────────────────────────
  await client.query(`
    CREATE TABLE IF NOT EXISTS tag (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT,
      created_at TEXT NOT NULL DEFAULT now()::TEXT
    )
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS entry_tag (
      entry_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (entry_id, tag_id)
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_entry_tag_entry ON entry_tag(entry_id)`);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_entry_tag_tag ON entry_tag(tag_id)`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS insight (
      id TEXT PRIMARY KEY,
      insight_date TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('TREND','THRESHOLD','SUGGESTION')),
      message TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('INFO','WARNING')),
      metadata TEXT,
      created_at TEXT NOT NULL DEFAULT now()::TEXT
    )
  `);
  await client.query(`CREATE INDEX IF NOT EXISTS idx_insight_date ON insight(insight_date)`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await client.end();
  console.log('[migrate] All tables ready.');
}

migrate().catch((err) => {
  console.error('[migrate] Failed:', err);
  process.exit(1);
});
