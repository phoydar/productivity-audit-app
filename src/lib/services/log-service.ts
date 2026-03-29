import { db } from '@/lib/db';
import { dailyLog, logEntry } from '@/lib/db/schema';
import { eq, between, desc, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { format } from 'date-fns';

export async function getLogByDate(date: string) {
  const result = await db.query.dailyLog.findFirst({
    where: eq(dailyLog.logDate, date),
    with: { entries: { orderBy: (entries, { asc }) => [asc(entries.sortOrder)] } },
  });
  return result ?? null;
}

export async function getOrCreateLog(date: string) {
  const existing = await getLogByDate(date);
  if (existing) return existing;

  const id = createId();
  await db.insert(dailyLog).values({
    id,
    logDate: date,
  });

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

export async function recalculateLogTotals(date: string) {
  const log = await getLogByDate(date);
  if (!log) return;

  const entries = await db.query.logEntry.findMany({
    where: eq(logEntry.dailyLogId, log.id),
  });

  const totals = entries.reduce(
    (acc, entry) => {
      const hours = entry.durationMinutes / 60;
      switch (entry.category) {
        case 'HIGH_FOCUS':
          acc.totalHighFocus += hours;
          break;
        case 'MEDIUM':
          acc.totalMedium += hours;
          break;
        case 'LOW_FOCUS':
          acc.totalLowFocus += hours;
          break;
        case 'MEETING':
          acc.totalMeetings += hours;
          break;
        case 'INTERRUPTION':
          acc.totalInterruptions += hours;
          break;
        case 'PERSONAL_MISC':
          acc.totalPersonalMisc += hours;
          break;
      }
      return acc;
    },
    { totalHighFocus: 0, totalMedium: 0, totalLowFocus: 0, totalMeetings: 0, totalInterruptions: 0, totalPersonalMisc: 0 }
  );

  await db
    .update(dailyLog)
    .set({ ...totals, updatedAt: new Date().toISOString() })
    .where(eq(dailyLog.logDate, date));
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
