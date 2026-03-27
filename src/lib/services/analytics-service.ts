import { db } from '@/lib/db';
import { dailyLog } from '@/lib/db/schema';
import { desc, between, sql, gte, lte } from 'drizzle-orm';
import { format, subDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export interface WeeklyBreakdown {
  date: string;
  deepWork: number;
  shallowWork: number;
  interruptions: number;
  personalMisc: number;
  total: number;
}

export interface TrendData {
  currentWeek: {
    avgDeepWork: number;
    avgShallowWork: number;
    avgInterruptions: number;
    avgPersonalMisc: number;
    totalDays: number;
  };
  previousWeeks: {
    avgDeepWork: number;
    avgShallowWork: number;
    avgInterruptions: number;
    avgPersonalMisc: number;
    totalDays: number;
  };
  deltas: {
    deepWork: number;
    shallowWork: number;
    interruptions: number;
    personalMisc: number;
  };
}

export async function getWeeklyBreakdown(): Promise<WeeklyBreakdown[]> {
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const logs = await db.query.dailyLog.findMany({
    where: between(dailyLog.logDate, weekStart, weekEnd),
    orderBy: [desc(dailyLog.logDate)],
  });

  return logs.map((log) => ({
    date: log.logDate,
    deepWork: log.totalDeepWork ?? 0,
    shallowWork: log.totalShallowWork ?? 0,
    interruptions: log.totalInterruptions ?? 0,
    personalMisc: log.totalPersonalMisc ?? 0,
    total: (log.totalDeepWork ?? 0) + (log.totalShallowWork ?? 0) + (log.totalInterruptions ?? 0) + (log.totalPersonalMisc ?? 0),
  }));
}

export async function getTrends(weeks: number = 4): Promise<TrendData> {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const previousStart = subWeeks(currentWeekStart, weeks);

  const currentLogs = await db.query.dailyLog.findMany({
    where: between(
      dailyLog.logDate,
      format(currentWeekStart, 'yyyy-MM-dd'),
      format(currentWeekEnd, 'yyyy-MM-dd')
    ),
  });

  const previousLogs = await db.query.dailyLog.findMany({
    where: between(
      dailyLog.logDate,
      format(previousStart, 'yyyy-MM-dd'),
      format(subDays(currentWeekStart, 1), 'yyyy-MM-dd')
    ),
  });

  const avg = (logs: typeof currentLogs) => {
    if (logs.length === 0)
      return {
        avgDeepWork: 0,
        avgShallowWork: 0,
        avgInterruptions: 0,
        avgPersonalMisc: 0,
        totalDays: 0,
      };
    const n = logs.length;
    return {
      avgDeepWork: logs.reduce((s, l) => s + (l.totalDeepWork ?? 0), 0) / n,
      avgShallowWork: logs.reduce((s, l) => s + (l.totalShallowWork ?? 0), 0) / n,
      avgInterruptions: logs.reduce((s, l) => s + (l.totalInterruptions ?? 0), 0) / n,
      avgPersonalMisc: logs.reduce((s, l) => s + (l.totalPersonalMisc ?? 0), 0) / n,
      totalDays: n,
    };
  };

  const current = avg(currentLogs);
  const previous = avg(previousLogs);

  return {
    currentWeek: current,
    previousWeeks: previous,
    deltas: {
      deepWork: current.avgDeepWork - previous.avgDeepWork,
      shallowWork: current.avgShallowWork - previous.avgShallowWork,
      interruptions: current.avgInterruptions - previous.avgInterruptions,
      personalMisc: current.avgPersonalMisc - previous.avgPersonalMisc,
    },
  };
}
