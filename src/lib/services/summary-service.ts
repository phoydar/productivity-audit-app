import { db } from '@/lib/db';
import { dailyLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getLogByDate, updateLog } from './log-service';
import { getEntriesForDate } from './entry-service';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import type { CategoryBreakdown } from '@/types';

export async function generateSummary(date: string) {
  const entries = await getEntriesForDate(date);
  if (entries.length === 0) {
    return { error: 'No entries found for this date. Log some activities first.' };
  }

  // Compute breakdown from entries (category is joined)
  const breakdownMap = new Map<string, CategoryBreakdown>();
  for (const entry of entries) {
    const hours = entry.durationMinutes / 60;
    const cat = entry.category;
    const existing = breakdownMap.get(cat.id);
    if (existing) {
      existing.totalHours += hours;
    } else {
      breakdownMap.set(cat.id, {
        categoryId: cat.id,
        name: cat.name,
        color: cat.color,
        isFocusType: cat.isFocusType,
        totalHours: hours,
      });
    }
  }

  const breakdown = Array.from(breakdownMap.values());
  const totalHours = breakdown.reduce((s, b) => s + b.totalHours, 0);
  const focusHours = breakdown.filter((b) => b.isFocusType).reduce((s, b) => s + b.totalHours, 0);
  const interruptionHours = breakdown.find((b) => b.name === 'Interruption')?.totalHours ?? 0;
  const interruptPct = totalHours > 0 ? Math.round((interruptionHours / totalHours) * 100) : 0;
  const focusPct = totalHours > 0 ? Math.round((focusHours / totalHours) * 100) : 0;

  const topCategory = [...breakdown].sort((a, b) => b.totalHours - a.totalHours)[0];

  const summary = `Logged ${totalHours.toFixed(1)}h across ${entries.length} activities. The day was primarily ${topCategory.name} (${Math.round((topCategory.totalHours / totalHours) * 100)}% of time). Focus work accounted for ${focusHours.toFixed(1)}h (${focusPct}%).`;

  const observations: string[] = [];

  if (focusHours >= DEFAULT_SETTINGS.highFocusTargetHours) {
    observations.push(`Hit the focus target (${focusHours.toFixed(1)}h vs ${DEFAULT_SETTINGS.highFocusTargetHours}h goal).`);
  } else {
    observations.push(`Focus work fell short of target: ${focusHours.toFixed(1)}h vs ${DEFAULT_SETTINGS.highFocusTargetHours}h goal.`);
  }

  if (interruptPct > DEFAULT_SETTINGS.interruptionWarningPct) {
    observations.push(`Interruptions are high at ${interruptPct}% of total time (threshold: ${DEFAULT_SETTINGS.interruptionWarningPct}%).`);
  }

  if (totalHours < DEFAULT_SETTINGS.expectedWorkHours * 0.75) {
    observations.push(`Total logged time (${totalHours.toFixed(1)}h) is below expected ${DEFAULT_SETTINGS.expectedWorkHours}h — possible unlogged activities.`);
  }

  const observationsText = observations.join(' ');

  await updateLog(date, { summary, observations: observationsText });
  await db.update(dailyLog).set({ generatedAt: new Date().toISOString() }).where(eq(dailyLog.logDate, date));

  return { summary, workLog: entries, breakdown, observations: observationsText };
}

export async function getSummary(date: string) {
  const log = await getLogByDate(date);
  if (!log) return null;

  return {
    summary: log.summary,
    observations: log.observations,
    breakdown: log.breakdown ?? [],
    workLog: log.entries ?? [],
    generatedAt: log.generatedAt,
  };
}
