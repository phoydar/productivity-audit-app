import { db } from '@/lib/db';
import { dailyLog } from '@/lib/db/schema';
import { desc, between } from 'drizzle-orm';
import { format, subDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

export interface WeeklyBreakdown {
  date: string;
  highFocus: number;
  medium: number;
  lowFocus: number;
  meetings: number;
  interruptions: number;
  personalMisc: number;
  total: number;
}

export interface TrendData {
  currentWeek: {
    avgHighFocus: number;
    avgMedium: number;
    avgLowFocus: number;
    avgMeetings: number;
    avgInterruptions: number;
    avgPersonalMisc: number;
    totalDays: number;
  };
  previousWeeks: {
    avgHighFocus: number;
    avgMedium: number;
    avgLowFocus: number;
    avgMeetings: number;
    avgInterruptions: number;
    avgPersonalMisc: number;
    totalDays: number;
  };
  deltas: {
    highFocus: number;
    medium: number;
    lowFocus: number;
    meetings: number;
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
    highFocus: log.totalHighFocus ?? 0,
    medium: log.totalMedium ?? 0,
    lowFocus: log.totalLowFocus ?? 0,
    meetings: log.totalMeetings ?? 0,
    interruptions: log.totalInterruptions ?? 0,
    personalMisc: log.totalPersonalMisc ?? 0,
    total: (log.totalHighFocus ?? 0) + (log.totalMedium ?? 0) + (log.totalLowFocus ?? 0) + (log.totalMeetings ?? 0) + (log.totalInterruptions ?? 0) + (log.totalPersonalMisc ?? 0),
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
      return { avgHighFocus: 0, avgMedium: 0, avgLowFocus: 0, avgMeetings: 0, avgInterruptions: 0, avgPersonalMisc: 0, totalDays: 0 };
    const n = logs.length;
    return {
      avgHighFocus: logs.reduce((s, l) => s + (l.totalHighFocus ?? 0), 0) / n,
      avgMedium: logs.reduce((s, l) => s + (l.totalMedium ?? 0), 0) / n,
      avgLowFocus: logs.reduce((s, l) => s + (l.totalLowFocus ?? 0), 0) / n,
      avgMeetings: logs.reduce((s, l) => s + (l.totalMeetings ?? 0), 0) / n,
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
      highFocus: current.avgHighFocus - previous.avgHighFocus,
      medium: current.avgMedium - previous.avgMedium,
      lowFocus: current.avgLowFocus - previous.avgLowFocus,
      meetings: current.avgMeetings - previous.avgMeetings,
      interruptions: current.avgInterruptions - previous.avgInterruptions,
      personalMisc: current.avgPersonalMisc - previous.avgPersonalMisc,
    },
  };
}
