'use client';

import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import Link from 'next/link';

interface Insight {
  id: string;
  message: string;
  severity: 'INFO' | 'WARNING';
  type: string;
}

export function InsightsPanel() {
  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const res = await fetch('/api/analytics/insights');
        if (res.ok) {
          const data = await res.json();
          setInsights(data.insights?.slice(0, 3) ?? []);
        }
      } catch {
        // silent
      }
    }
    fetchInsights();
  }, []);

  return (
    <div className="bg-surface-container-low p-8 rounded-lg self-stretch flex flex-col">
      <div className="flex items-center gap-3 mb-8">
        <Zap size={20} className="text-primary" fill="currentColor" />
        <h3 className="text-xl font-bold text-on-surface tracking-tight">Recent Insights</h3>
      </div>

      {insights.length > 0 ? (
        <ul className="space-y-6 flex-1">
          {insights.map((insight) => (
            <li key={insight.id} className="flex items-start gap-4">
              <div
                className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  insight.severity === 'WARNING' ? 'bg-error' : 'bg-primary-container'
                }`}
              />
              <p className="text-sm text-on-surface leading-relaxed">{insight.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-on-surface-variant text-center">
            Log 5+ days to unlock pattern insights.
          </p>
        </div>
      )}

      <div className="mt-8 pt-6 border-t border-outline-variant/15">
        <Link
          href="/settings"
          className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2 hover:gap-3 transition-all"
        >
          Configure Thresholds
        </Link>
      </div>
    </div>
  );
}
