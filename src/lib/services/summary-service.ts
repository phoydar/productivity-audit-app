import { db } from '@/lib/db';
import { dailyLog } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getLogByDate, updateLog, recalculateLogTotals } from './log-service';
import { getEntriesForDate } from './entry-service';
import { CATEGORIES, DEFAULT_SETTINGS } from '@/lib/constants';
import type { CategoryType, TimeBreakdown } from '@/types';

export async function generateSummary(date: string) {
  const entries = await getEntriesForDate(date);
  if (entries.length === 0) {
    return { error: 'No entries found for this date. Log some activities first.' };
  }

  await recalculateLogTotals(date);

  const breakdown: TimeBreakdown = entries.reduce(
    (acc, entry) => {
      const hours = entry.durationMinutes / 60;
      switch (entry.category as CategoryType) {
        case 'DEEP_WORK':
          acc.deepWork += hours;
          break;
        case 'SHALLOW_WORK':
          acc.shallowWork += hours;
          break;
        case 'INTERRUPTION':
          acc.interruptions += hours;
          break;
        case 'PERSONAL_MISC':
          acc.personalMisc += hours;
          break;
      }
      acc.total += hours;
      return acc;
    },
    { deepWork: 0, shallowWork: 0, interruptions: 0, personalMisc: 0, total: 0 }
  );

  const totalHours = breakdown.total;
  const deepPct = totalHours > 0 ? Math.round((breakdown.deepWork / totalHours) * 100) : 0;
  const interruptPct = totalHours > 0 ? Math.round((breakdown.interruptions / totalHours) * 100) : 0;

  // Build narrative summary
  const topCategory = Object.entries(breakdown)
    .filter(([k]) => k !== 'total')
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];

  const categoryLabel = {
    deepWork: 'deep work',
    shallowWork: 'shallow work',
    interruptions: 'interruptions',
    personalMisc: 'personal/misc tasks',
  }[topCategory[0]] ?? topCategory[0];

  const summary = `Logged ${totalHours.toFixed(1)}h across ${entries.length} activities. The day was primarily spent on ${categoryLabel} (${(((topCategory[1] as number) / totalHours) * 100).toFixed(0)}% of time). Deep work accounted for ${breakdown.deepWork.toFixed(1)}h (${deepPct}%).`;

  // Build observations
  const observations: string[] = [];

  if (breakdown.deepWork >= DEFAULT_SETTINGS.deepWorkTargetHours) {
    observations.push(
      `Hit the deep work target (${breakdown.deepWork.toFixed(1)}h vs ${DEFAULT_SETTINGS.deepWorkTargetHours}h goal).`
    );
  } else {
    observations.push(
      `Deep work fell short of target: ${breakdown.deepWork.toFixed(1)}h vs ${DEFAULT_SETTINGS.deepWorkTargetHours}h goal.`
    );
  }

  if (interruptPct > DEFAULT_SETTINGS.interruptionWarningPct) {
    observations.push(
      `Interruptions are high at ${interruptPct}% of total time (threshold: ${DEFAULT_SETTINGS.interruptionWarningPct}%).`
    );
  }

  if (totalHours < DEFAULT_SETTINGS.expectedWorkHours * 0.75) {
    observations.push(
      `Total logged time (${totalHours.toFixed(1)}h) is significantly below expected ${DEFAULT_SETTINGS.expectedWorkHours}h — possible unlogged activities.`
    );
  }

  const observationsText = observations.join(' ');

  await updateLog(date, { summary, observations: observationsText });

  // Update generatedAt
  await db.update(dailyLog).set({ generatedAt: new Date().toISOString() }).where(eq(dailyLog.logDate, date));

  return {
    summary,
    workLog: entries,
    timeBreakdown: breakdown,
    observations: observationsText,
  };
}

export async function getSummary(date: string) {
  const log = await getLogByDate(date);
  if (!log) return null;

  const entries = await getEntriesForDate(date);

  return {
    summary: log.summary,
    observations: log.observations,
    timeBreakdown: {
      deepWork: log.totalDeepWork,
      shallowWork: log.totalShallowWork,
      interruptions: log.totalInterruptions,
      personalMisc: log.totalPersonalMisc,
      total: log.totalDeepWork + log.totalShallowWork + log.totalInterruptions + log.totalPersonalMisc,
    },
    workLog: entries,
    generatedAt: log.generatedAt,
  };
}
