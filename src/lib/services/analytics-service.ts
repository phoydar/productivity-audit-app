import { db } from '@/lib/db';
import { dailyLog, logEntry, category } from '@/lib/db/schema';
import { eq, between, sql } from 'drizzle-orm';
import { format, startOfWeek, endOfWeek, subWeeks, subDays } from 'date-fns';
import type { CategoryBreakdown } from '@/types';

export interface DayBreakdown {
  date: string;
  categories: CategoryBreakdown[];
  totalHours: number;
}

export interface TrendData {
  currentWeek: {
    avgFocusHours: number;
    avgTotalHours: number;
    totalDays: number;
    byCategory: Record<string, number>; // categoryId → avg hours
  };
  previousWeeks: {
    avgFocusHours: number;
    avgTotalHours: number;
    totalDays: number;
    byCategory: Record<string, number>;
  };
  deltas: {
    focusHours: number;
    totalHours: number;
  };
}

async function getBreakdownForRange(fromDate: string, toDate: string): Promise<DayBreakdown[]> {
  const rows = await db
    .select({
      date: dailyLog.logDate,
      categoryId: logEntry.categoryId,
      categoryName: category.name,
      categoryColor: category.color,
      isFocusType: category.isFocusType,
      totalMinutes: sql<number>`cast(sum(${logEntry.durationMinutes}) as int)`,
    })
    .from(logEntry)
    .innerJoin(dailyLog, eq(logEntry.dailyLogId, dailyLog.id))
    .innerJoin(category, eq(logEntry.categoryId, category.id))
    .where(between(dailyLog.logDate, fromDate, toDate))
    .groupBy(dailyLog.logDate, logEntry.categoryId, category.name, category.color, category.isFocusType);

  const byDate = new Map<string, DayBreakdown>();
  for (const row of rows) {
    if (!byDate.has(row.date)) {
      byDate.set(row.date, { date: row.date, categories: [], totalHours: 0 });
    }
    const day = byDate.get(row.date)!;
    const hours = row.totalMinutes / 60;
    day.categories.push({
      categoryId: row.categoryId,
      name: row.categoryName,
      color: row.categoryColor,
      isFocusType: row.isFocusType,
      totalHours: hours,
    });
    day.totalHours += hours;
  }

  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export async function getWeeklyBreakdown(): Promise<DayBreakdown[]> {
  const today = new Date();
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  return getBreakdownForRange(weekStart, weekEnd);
}

export async function getTrends(weeks: number = 4): Promise<TrendData> {
  const today = new Date();
  const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
  const currentWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const previousStart = subWeeks(currentWeekStart, weeks);

  const [currentDays, previousDays] = await Promise.all([
    getBreakdownForRange(
      format(currentWeekStart, 'yyyy-MM-dd'),
      format(currentWeekEnd, 'yyyy-MM-dd')
    ),
    getBreakdownForRange(
      format(previousStart, 'yyyy-MM-dd'),
      format(subDays(currentWeekStart, 1), 'yyyy-MM-dd')
    ),
  ]);

  function summarize(days: DayBreakdown[]) {
    if (days.length === 0) {
      return { avgFocusHours: 0, avgTotalHours: 0, totalDays: 0, byCategory: {} };
    }
    const n = days.length;
    const byCategory: Record<string, number> = {};
    let totalFocus = 0;
    let totalAll = 0;
    for (const day of days) {
      totalAll += day.totalHours;
      for (const cat of day.categories) {
        byCategory[cat.categoryId] = (byCategory[cat.categoryId] ?? 0) + cat.totalHours;
        if (cat.isFocusType) totalFocus += cat.totalHours;
      }
    }
    for (const k of Object.keys(byCategory)) {
      byCategory[k] /= n;
    }
    return { avgFocusHours: totalFocus / n, avgTotalHours: totalAll / n, totalDays: n, byCategory };
  }

  const current = summarize(currentDays);
  const previous = summarize(previousDays);

  return {
    currentWeek: current,
    previousWeeks: previous,
    deltas: {
      focusHours: current.avgFocusHours - previous.avgFocusHours,
      totalHours: current.avgTotalHours - previous.avgTotalHours,
    },
  };
}

export async function getBreakdownSummary(fromDate: string, toDate: string) {
  return getBreakdownForRange(fromDate, toDate);
}
