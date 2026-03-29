'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { CategoryBreakdown } from '@/types';

interface TimeBreakdownProps {
  breakdown: CategoryBreakdown[];
}

export function TimeBreakdown({ breakdown }: TimeBreakdownProps) {
  const total = breakdown.reduce((s, b) => s + b.totalHours, 0);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-on-surface-variant">
        No time logged yet.
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={breakdown}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={2}
              dataKey="totalHours"
              stroke="none"
            >
              {breakdown.map((entry) => (
                <Cell key={entry.categoryId} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-2xl font-black text-on-surface">{total.toFixed(1)}h</span>
            <p className="text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">Logged</p>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {breakdown.map((item) => (
          <div key={item.categoryId} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-on-surface-variant">{item.name}</span>
            </div>
            <span className="font-medium text-on-surface">{item.totalHours.toFixed(1)}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
