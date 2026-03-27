'use client';

import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface TimeBreakdownProps {
  deepWork: number;
  shallowWork: number;
  meetings: number;
  interruptions: number;
  personalMisc: number;
}

const COLORS = {
  deepWork: '#2563eb',
  shallowWork: '#fea619',
  meetings: '#0d9488',
  interruptions: '#ba1a1a',
  personalMisc: '#7d4ce7',
};

const LABELS = {
  deepWork: 'Deep Work',
  shallowWork: 'Shallow Work',
  meetings: 'Meetings',
  interruptions: 'Interruptions',
  personalMisc: 'Personal',
};

export function TimeBreakdown({ deepWork, shallowWork, meetings, interruptions, personalMisc }: TimeBreakdownProps) {
  const total = deepWork + shallowWork + meetings + interruptions + personalMisc;

  const data = [
    { name: 'Deep Work', value: deepWork, color: COLORS.deepWork },
    { name: 'Shallow Work', value: shallowWork, color: COLORS.shallowWork },
    { name: 'Meetings', value: meetings, color: COLORS.meetings },
    { name: 'Interruptions', value: interruptions, color: COLORS.interruptions },
    { name: 'Personal', value: personalMisc, color: COLORS.personalMisc },
  ].filter((d) => d.value > 0);

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
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
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
        {[
          { label: 'Deep Work', value: deepWork, color: 'bg-primary-container' },
          { label: 'Shallow Work', value: shallowWork, color: 'bg-secondary-container' },
          { label: 'Meetings', value: meetings, color: 'bg-teal-500' },
          { label: 'Interruptions', value: interruptions, color: 'bg-error' },
          { label: 'Personal', value: personalMisc, color: 'bg-tertiary-container' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${item.color}`} />
              <span className="text-on-surface-variant">{item.label}</span>
            </div>
            <span className="font-medium text-on-surface">{item.value.toFixed(1)}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}
