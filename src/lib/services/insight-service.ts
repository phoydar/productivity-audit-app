import { db } from '@/lib/db';
import { insight, dailyLog, logEntry, category } from '@/lib/db/schema';
import { eq, between, desc, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { format } from 'date-fns';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { InsightType, SeverityType } from '@/types';

export async function generateInsights(fromDate: string, toDate: string) {
  // Aggregate per-day focus hours and total hours using category.is_focus_type
  const rows = await db
    .select({
      logDate: dailyLog.logDate,
      isFocusType: category.isFocusType,
      totalMinutes: sql<number>`cast(sum(${logEntry.durationMinutes}) as int)`,
    })
    .from(logEntry)
    .innerJoin(dailyLog, eq(logEntry.dailyLogId, dailyLog.id))
    .innerJoin(category, eq(logEntry.categoryId, category.id))
    .where(between(dailyLog.logDate, fromDate, toDate))
    .groupBy(dailyLog.logDate, category.isFocusType);

  // Roll up into per-day stats
  const byDate = new Map<string, { focusHours: number; totalHours: number }>();
  for (const row of rows) {
    const hours = row.totalMinutes / 60;
    const existing = byDate.get(row.logDate) ?? { focusHours: 0, totalHours: 0 };
    byDate.set(row.logDate, {
      focusHours: existing.focusHours + (row.isFocusType ? hours : 0),
      totalHours: existing.totalHours + hours,
    });
  }

  const days = Array.from(byDate.values());

  if (days.length < 3) {
    return { message: 'Need at least 3 days of data to generate insights.' };
  }

  const avgFocusHours = days.reduce((s, d) => s + d.focusHours, 0) / days.length;
  const avgTotalHours = days.reduce((s, d) => s + d.totalHours, 0) / days.length;
  const avgInterruptions = 0; // TODO: track interruptions category separately when needed
  const interruptPct = avgTotalHours > 0
    ? (days.reduce((s, d) => s + (d.totalHours - d.focusHours), 0) / days.length / avgTotalHours) * 100
    : 0;

  const generated: Array<{ type: InsightType; message: string; severity: SeverityType; metadata: string }> = [];

  if (avgFocusHours < DEFAULT_SETTINGS.highFocusTargetHours) {
    generated.push({
      type: 'THRESHOLD',
      message: `Focus work averaged ${avgFocusHours.toFixed(1)}h/day over the last ${days.length} days — below the ${DEFAULT_SETTINGS.highFocusTargetHours}h target.`,
      severity: 'WARNING',
      metadata: JSON.stringify({ avgFocusHours, target: DEFAULT_SETTINGS.highFocusTargetHours, days: days.length }),
    });
  }

  if (interruptPct > DEFAULT_SETTINGS.interruptionWarningPct) {
    generated.push({
      type: 'THRESHOLD',
      message: `Non-focus work accounts for ${interruptPct.toFixed(0)}% of time over the last ${days.length} days (threshold: ${DEFAULT_SETTINGS.interruptionWarningPct}%).`,
      severity: 'WARNING',
      metadata: JSON.stringify({ interruptPct, threshold: DEFAULT_SETTINGS.interruptionWarningPct }),
    });
  }

  if (days.length >= 5) {
    const sorted = Array.from(byDate.entries()).sort(([a], [b]) => a.localeCompare(b));
    const half = Math.floor(sorted.length / 2);
    const earlierAvg = sorted.slice(0, half).reduce((s, [, d]) => s + d.focusHours, 0) / half;
    const recentAvg = sorted.slice(half).reduce((s, [, d]) => s + d.focusHours, 0) / (sorted.length - half);

    if (recentAvg < earlierAvg * 0.8) {
      generated.push({
        type: 'TREND',
        message: `Focus work is trending downward: ${recentAvg.toFixed(1)}h/day recently vs ${earlierAvg.toFixed(1)}h/day earlier.`,
        severity: 'WARNING',
        metadata: JSON.stringify({ recentAvg, earlierAvg }),
      });
    }
  }

  if (avgFocusHours >= DEFAULT_SETTINGS.highFocusTargetHours) {
    generated.push({
      type: 'TREND',
      message: `Focus work averaged ${avgFocusHours.toFixed(1)}h/day — meeting the target. Keep it up.`,
      severity: 'INFO',
      metadata: JSON.stringify({ avgFocusHours, target: DEFAULT_SETTINGS.highFocusTargetHours }),
    });
  }

  if (interruptPct > 30) {
    generated.push({
      type: 'SUGGESTION',
      message: 'Consider time-blocking: reserve 2-3h blocks for focus work with notifications off.',
      severity: 'INFO',
      metadata: JSON.stringify({ trigger: 'high_non_focus_pct', interruptPct }),
    });
  }

  const today = format(new Date(), 'yyyy-MM-dd');
  for (const item of generated) {
    await db.insert(insight).values({
      id: createId(),
      insightDate: today,
      type: item.type,
      message: item.message,
      severity: item.severity,
      metadata: item.metadata,
    });
  }

  return { insights: generated, count: generated.length };
}

export async function getInsights(from?: string, to?: string) {
  if (from && to) {
    return db.query.insight.findMany({
      where: between(insight.insightDate, from, to),
      orderBy: [desc(insight.createdAt)],
    });
  }
  return db.query.insight.findMany({
    orderBy: [desc(insight.createdAt)],
    limit: 20,
  });
}
