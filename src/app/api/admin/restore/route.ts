import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { dailyLog, logEntry, tag, entryTag, insight, todo, settings } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

/**
 * TEMPORARY endpoint for one-time data migration.
 * POST /api/admin/restore
 * Body: { tables: { daily_log: [...], log_entry: [...], ... } }
 *
 * DELETE THIS FILE AFTER MIGRATION.
 */
export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;

  // Extra safety: require API_SECRET for this endpoint (no same-origin bypass)
  const secret = request.headers.get('x-api-secret');
  if (!secret || secret !== process.env.API_SECRET) {
    return NextResponse.json({ error: 'Requires API secret' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tables } = body;
    const results: Record<string, number> = {};

    // Insert in dependency order
    if (tables.daily_log?.length) {
      for (const row of tables.daily_log) {
        await db.insert(dailyLog).values(row).onConflictDoNothing();
      }
      results.daily_log = tables.daily_log.length;
    }

    if (tables.log_entry?.length) {
      for (const row of tables.log_entry) {
        await db.insert(logEntry).values(row).onConflictDoNothing();
      }
      results.log_entry = tables.log_entry.length;
    }

    if (tables.tag?.length) {
      for (const row of tables.tag) {
        await db.insert(tag).values(row).onConflictDoNothing();
      }
      results.tag = tables.tag.length;
    }

    if (tables.entry_tag?.length) {
      for (const row of tables.entry_tag) {
        await db.insert(entryTag).values(row).onConflictDoNothing();
      }
      results.entry_tag = tables.entry_tag.length;
    }

    if (tables.insight?.length) {
      for (const row of tables.insight) {
        await db.insert(insight).values(row).onConflictDoNothing();
      }
      results.insight = tables.insight.length;
    }

    if (tables.todo?.length) {
      for (const row of tables.todo) {
        await db.insert(todo).values(row).onConflictDoNothing();
      }
      results.todo = tables.todo.length;
    }

    if (tables.settings?.length) {
      for (const row of tables.settings) {
        await db.insert(settings).values(row).onConflictDoNothing();
      }
      results.settings = tables.settings.length;
    }

    return NextResponse.json({ success: true, imported: results });
  } catch (err) {
    return NextResponse.json({ error: 'Restore failed', details: String(err) }, { status: 500 });
  }
}
