'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfWeek, addDays } from 'date-fns';

interface WeekDay {
  day: string;
  date: string;
  highFocus: number;
  medium: number;
  lowFocus: number;
  meetings: number;
  interruptions: number;
  personalMisc: number;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeekOverview() {
  const [data, setData] = useState<WeekDay[]>([]);

  useEffect(() => {
    async function fetchWeek() {
      try {
        const res = await fetch('/api/analytics/weekly');
        if (res.ok) {
          const { breakdown } = await res.json();
          const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
          const week: WeekDay[] = DAY_LABELS.map((label, i) => {
            const date = format(addDays(weekStart, i), 'yyyy-MM-dd');
            const existing = breakdown?.find((b: any) => b.date === date);
            return {
              day: label,
              date,
              highFocus: existing?.highFocus ?? 0,
              medium: existing?.medium ?? 0,
              lowFocus: existing?.lowFocus ?? 0,
              meetings: existing?.meetings ?? 0,
              interruptions: existing?.interruptions ?? 0,
              personalMisc: existing?.personalMisc ?? 0,
            };
          });
          setData(week);
        } else {
          setData(DAY_LABELS.map((label) => ({ day: label, date: '', highFocus: 0, medium: 0, lowFocus: 0, meetings: 0, interruptions: 0, personalMisc: 0 })));
        }
      } catch {
        setData(DAY_LABELS.map((label) => ({ day: label, date: '', highFocus: 0, medium: 0, lowFocus: 0, meetings: 0, interruptions: 0, personalMisc: 0 })));
      }
    }
    fetchWeek();
  }, []);

  const hasData = data.some((d) => d.highFocus + d.medium + d.lowFocus + d.meetings + d.interruptions + d.personalMisc > 0);

  return (
    <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-lg">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-xl font-bold text-on-surface tracking-tight">This Week</h3>
          <p className="text-sm text-on-surface-variant">Work Distribution by Category</p>
        </div>
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary-container" />High Focus</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" />Medium</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary-container" />Low Focus</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" />Meetings</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-error" />Interruptions</div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-tertiary-container" />Misc</div>
        </div>
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={256}>
          <BarChart data={data} barGap={2}>
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
              formatter={(value) => [`${Number(value).toFixed(1)}h`]}
            />
            <Bar dataKey="highFocus" name="High Focus" stackId="a" fill="#2563eb" radius={[0, 0, 0, 0]} />
            <Bar dataKey="medium" name="Medium" stackId="a" fill="#6366f1" />
            <Bar dataKey="lowFocus" name="Low Focus" stackId="a" fill="#fea619" />
            <Bar dataKey="meetings" name="Meetings" stackId="a" fill="#0d9488" />
            <Bar dataKey="interruptions" name="Interruptions" stackId="a" fill="#ba1a1a" />
            <Bar dataKey="personalMisc" name="Misc" stackId="a" fill="#7d4ce7" radius={[4, 4, 0, 0]} />
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
