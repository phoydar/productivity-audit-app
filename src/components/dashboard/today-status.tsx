'use client';

import { useEffect, useState } from 'react';
import { ListChecks, Clock, Brain } from 'lucide-react';
import { format } from 'date-fns';
import type { CategoryBreakdown } from '@/types';

interface TodayData {
  entryCount: number;
  totalHours: number;
  focusHours: number;
  focusTarget: number;
  expectedHours: number;
}

export function TodayStatus() {
  const [data, setData] = useState<TodayData | null>(null);
  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    async function fetchToday() {
      try {
        const res = await fetch(`/api/logs/${today}`);
        if (res.ok) {
          const { log } = await res.json();
          const breakdown: CategoryBreakdown[] = log?.breakdown ?? [];
          const totalHours = breakdown.reduce((s, b) => s + b.totalHours, 0);
          const focusHours = breakdown.filter((b) => b.isFocusType).reduce((s, b) => s + b.totalHours, 0);
          setData({
            entryCount: log?.entries?.length ?? 0,
            totalHours,
            focusHours,
            focusTarget: 3,
            expectedHours: 8,
          });
        } else {
          setData({ entryCount: 0, totalHours: 0, focusHours: 0, focusTarget: 3, expectedHours: 8 });
        }
      } catch {
        setData({ entryCount: 0, totalHours: 0, focusHours: 0, focusTarget: 3, expectedHours: 8 });
      }
    }
    fetchToday();
  }, [today]);

  if (!data) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-6 bg-surface-container-lowest rounded-lg animate-pulse h-32" />
        ))}
      </section>
    );
  }

  const focusPct = data.focusTarget > 0 ? Math.min((data.focusHours / data.focusTarget) * 100, 100) : 0;
  const totalPct = data.expectedHours > 0 ? Math.min((data.totalHours / data.expectedHours) * 100, 100) : 0;

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 bg-surface-container-lowest rounded-lg">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-on-surface-variant uppercase tracking-tighter">Entries Logged</p>
          <ListChecks size={20} className="text-primary-container" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-on-surface">{data.entryCount}</span>
          <span className="text-sm font-medium text-on-surface-variant">today</span>
        </div>
      </div>

      <div className="p-6 bg-surface-container-lowest rounded-lg">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-on-surface-variant uppercase tracking-tighter">Total Time</p>
          <Clock size={20} className="text-secondary-container" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-on-surface">{data.totalHours.toFixed(1)}h</span>
          <span className="text-sm font-medium text-on-surface-variant">/ {data.expectedHours}h target</span>
        </div>
        <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
          <div className="h-full bg-secondary-container transition-all duration-500" style={{ width: `${totalPct}%` }} />
        </div>
      </div>

      <div className="p-6 bg-surface-container-lowest rounded-lg">
        <div className="flex justify-between items-start mb-4">
          <p className="text-sm font-medium text-on-surface-variant uppercase tracking-tighter">Focus Time</p>
          <Brain size={20} className="text-tertiary" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-on-surface">{data.focusHours.toFixed(1)}h</span>
          <span className={`text-sm font-medium ${focusPct >= 100 ? 'text-primary' : focusPct >= 70 ? 'text-secondary-container' : 'text-error'}`}>
            {focusPct >= 100 ? 'Target Met' : `${focusPct.toFixed(0)}% of target`}
          </span>
        </div>
        <div className="mt-4 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${focusPct >= 100 ? 'bg-primary' : focusPct >= 70 ? 'bg-secondary-container' : 'bg-error'}`}
            style={{ width: `${focusPct}%` }}
          />
        </div>
      </div>
    </section>
  );
}
