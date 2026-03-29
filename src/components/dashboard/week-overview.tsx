'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, addDays } from 'date-fns';
import type { Category, CategoryBreakdown } from '@/types';
import { useCategories } from '@/hooks/use-categories';

interface DayBreakdown {
  date: string;
  categories: CategoryBreakdown[];
  totalHours: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// Build a chart-friendly row: { day, date, [categoryId]: hours }
function buildChartData(breakdown: DayBreakdown[], categories: Category[]) {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  return DAY_LABELS.map((label, i) => {
    const date = format(addDays(weekStart, i), 'yyyy-MM-dd');
    const existing = breakdown.find((b) => b.date === date);
    const row: Record<string, string | number> = { day: label, date };
    for (const cat of categories) {
      const match = existing?.categories.find((c) => c.categoryId === cat.id);
      row[cat.id] = match?.totalHours ?? 0;
    }
    return row;
  });
}

export function WeekOverview() {
  const { categories } = useCategories();
  const [breakdown, setBreakdown] = useState<DayBreakdown[]>([]);

  useEffect(() => {
    async function fetchWeek() {
      try {
        const res = await fetch('/api/analytics/weekly');
        if (res.ok) {
          const { breakdown: data } = await res.json();
          setBreakdown(data ?? []);
        }
      } catch {
        // silent
      }
    }
    fetchWeek();
  }, []);

  const chartData = buildChartData(breakdown, categories);
  const hasData = chartData.some((d) =>
    categories.some((cat) => (d[cat.id] as number) > 0)
  );

  return (
    <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-lg">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-xl font-bold text-on-surface tracking-tight">This Week</h3>
          <p className="text-sm text-on-surface-variant">Work Distribution by Category</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={256}>
          <BarChart data={chartData} barGap={2}>
            <XAxis
              dataKey="day"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#434655', fontSize: 12, fontWeight: 700 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#737686', fontSize: 11 }}
              tickFormatter={(v) => `${v}h`}
            />
            <Tooltip
              contentStyle={{
                background: '#213145',
                border: 'none',
                borderRadius: '8px',
                color: '#eaf1ff',
                fontSize: '12px',
              }}
              formatter={(value, name) => {
                const cat = categories.find((c) => c.id === name);
                return [`${Number(value).toFixed(1)}h`, cat?.name ?? name];
              }}
            />
            {categories.map((cat, i) => (
              <Bar
                key={cat.id}
                dataKey={cat.id}
                name={cat.id}
                stackId="a"
                fill={cat.color}
                radius={i === categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-64 text-on-surface-variant text-sm">
          Start logging to see your week take shape.
        </div>
      )}
    </div>
  );
}
