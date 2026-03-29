import { db } from '@/lib/db';
import { insight, dailyLog } from '@/lib/db/schema';
import { eq, between, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { format, subDays } from 'date-fns';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { InsightType, SeverityType } from '@/types';

export async function generateInsights(fromDate: string, toDate: string) {
  const logs = await db.query.dailyLog.findMany({
    where: between(dailyLog.logDate, fromDate, toDate),
    orderBy: [desc(dailyLog.logDate)],
  });

  if (logs.length < 3) {
    return { message: 'Need at least 3 days of data to generate insights.' };
  }

  const generated: Array<{ type: InsightType; message: string; severity: SeverityType; metadata: string }> = [];

  const avgHighFocus = logs.reduce((s, l) => s + (l.totalHighFocus ?? 0), 0) / logs.length;
  const avgInterruptions = logs.reduce((s, l) => s + (l.totalInterruptions ?? 0), 0) / logs.length;
  const avgTotal =
    logs.reduce(
      (s, l) =>
        s + (l.totalHighFocus ?? 0) + (l.totalMedium ?? 0) + (l.totalLowFocus ?? 0) + (l.totalMeetings ?? 0) + (l.totalInterruptions ?? 0) + (l.totalPersonalMisc ?? 0),
      0
    ) / logs.length;
  const interruptPct = avgTotal > 0 ? (avgInterruptions / avgTotal) * 100 : 0;

  if (avgHighFocus < DEFAULT_SETTINGS.highFocusTargetHours) {
    generated.push({
      type: 'THRESHOLD',
      message: `High focus work averaged ${avgHighFocus.toFixed(1)}h/day over the last ${logs.length} days — below the ${DEFAULT_SETTINGS.highFocusTargetHours}h target.`,
      severity: 'WARNING',
      metadata: JSON.stringify({ avgHighFocus, target: DEFAULT_SETTINGS.highFocusTargetHours, days: logs.length }),
    });
  }

  if (interruptPct > DEFAULT_SETTINGS.interruptionWarningPct) {
    generated.push({
      type: 'THRESHOLD',
      message: `Interruptions account for ${interruptPct.toFixed(0)}% of time over the last ${logs.length} days (threshold: ${DEFAULT_SETTINGS.interruptionWarningPct}%).`,
      severity: 'WARNING',
      metadata: JSON.stringify({ interruptPct, threshold: DEFAULT_SETTINGS.interruptionWarningPct }),
    });
  }

  if (logs.length >= 5) {
    const firstHalf = logs.slice(Math.floor(logs.length / 2));
    const secondHalf = logs.slice(0, Math.floor(logs.length / 2));
    const firstAvg = firstHalf.reduce((s, l) => s + (l.totalHighFocus ?? 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, l) => s + (l.totalHighFocus ?? 0), 0) / secondHalf.length;

    if (secondAvg < firstAvg * 0.8) {
      generated.push({
        type: 'TREND',
        message: `High focus work is trending downward: ${secondAvg.toFixed(1)}h/day recently vs ${firstAvg.toFixed(1)}h/day earlier.`,
        severity: 'WARNING',
        metadata: JSON.stringify({ recentAvg: secondAvg, earlierAvg: firstAvg }),
      });
    }
  }

  if (avgHighFocus >= DEFAULT_SETTINGS.highFocusTargetHours) {
    generated.push({
      type: 'TREND',
      message: `High focus work averaged ${avgHighFocus.toFixed(1)}h/day — meeting the target. Keep it up.`,
      severity: 'INFO',
      metadata: JSON.stringify({ avgHighFocus, target: DEFAULT_SETTINGS.highFocusTargetHours }),
    });
  }

  if (interruptPct > 30) {
    generated.push({
      type: 'SUGGESTION',
      message: 'Consider time-blocking: reserve 2-3h blocks for high focus work with notifications off.',
      severity: 'INFO',
      metadata: JSON.stringify({ trigger: 'high_interruption_pct', interruptPct }),
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
