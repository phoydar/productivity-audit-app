'use client';

import { format } from 'date-fns';
import { TodayStatus } from '@/components/dashboard/today-status';
import { WeekOverview } from '@/components/dashboard/week-overview';
import { InsightsPanel } from '@/components/dashboard/insights-panel';
import { QuickAdd } from '@/components/dashboard/quick-add';
import { TodoPanel } from '@/components/dashboard/todo-panel';
import { useState } from 'react';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="p-12 max-w-7xl mx-auto space-y-12">
      {/* Hero Header */}
      <section className="flex justify-between items-end">
        <div>
          <p className="text-sm text-on-surface-variant font-medium tracking-wide uppercase mb-2">
            {format(new Date(), 'MMMM d, yyyy')}
          </p>
          <h2 className="text-[2.5rem] font-extrabold tracking-tight text-on-surface leading-tight">
            {getGreeting()}, Patrick
          </h2>
        </div>
        <QuickAdd onEntryAdded={() => setRefreshKey((k) => k + 1)} />
      </section>

      {/* Status Cards */}
      <TodayStatus key={`status-${refreshKey}`} />

      {/* Bento Layout: Todos + Chart + Insights */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <WeekOverview key={`week-${refreshKey}`} />
        <div className="space-y-8">
          <TodoPanel
            key={`todo-${refreshKey}`}
            onTodoCompleted={() => setRefreshKey((k) => k + 1)}
          />
          <InsightsPanel />
        </div>
      </section>
    </div>
  );
}
