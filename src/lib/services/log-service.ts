import { db } from '@/lib/db';
import { dailyLog, logEntry, category } from '@/lib/db/schema';
import { eq, between, desc, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { format } from 'date-fns';
import type { CategoryBreakdown } from '@/types';

function computeBreakdown(entries: Array<{ durationMinutes: number; category: { id: string; name: string; color: string; isFocusType: boolean } }>): CategoryBreakdown[] {
  const map = new Map<string, CategoryBreakdown>();
  for (const entry of entries) {
    const hours = entry.durationMinutes / 60;
    const cat = entry.category;
    const existing = map.get(cat.id);
    if (existing) {
      existing.totalHours += hours;
    } else {
      map.set(cat.id, {
        categoryId: cat.id,
        name: cat.name,
        color: cat.color,
        isFocusType: cat.isFocusType,
        totalHours: hours,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => b.totalHours - a.totalHours);
}

export async function getLogByDate(date: string) {
  const result = await db.query.dailyLog.findFirst({
    where: eq(dailyLog.logDate, date),
    with: {
      entries: {
        orderBy: (entries, { asc }) => [asc(entries.sortOrder)],
        with: { category: true },
      },
    },
  });

  if (!result) return null;

  return {
    ...result,
    breakdown: computeBreakdown(result.entries),
  };
}

export async function getOrCreateLog(date: string) {
  const existing = await getLogByDate(date);
  if (existing) return existing;

  const id = createId();
  await db.insert(dailyLog).values({ id, logDate: date });
  return getLogByDate(date);
}

export async function listLogs(from?: string, to?: string) {
  if (from && to) {
    return db.query.dailyLog.findMany({
      where: between(dailyLog.logDate, from, to),
      orderBy: [desc(dailyLog.logDate)],
    });
  }
  return db.query.dailyLog.findMany({
    orderBy: [desc(dailyLog.logDate)],
    limit: 30,
  });
}

export async function updateLog(date: string, data: { summary?: string; observations?: string }) {
  await db.update(dailyLog).set({ ...data, updatedAt: new Date().toISOString() }).where(eq(dailyLog.logDate, date));
  return getLogByDate(date);
}

export async function getLoggingStreak() {
  const logs = await db.query.dailyLog.findMany({
    orderBy: [desc(dailyLog.logDate)],
    limit: 365,
  });

  if (logs.length === 0) return 0;

  let streak = 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  let expectedDate = today;

  for (const log of logs) {
    if (log.logDate === expectedDate) {
      streak++;
      const prev = new Date(expectedDate);
      prev.setDate(prev.getDate() - 1);
      expectedDate = format(prev, 'yyyy-MM-dd');
    } else if (log.logDate < expectedDate) {
      break;
    }
  }

  return streak;
}
