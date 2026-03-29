'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { EntryCard, type EditPayload } from '@/components/day/entry-card';
import { TimeBreakdown } from '@/components/day/time-breakdown';
import { SummaryView } from '@/components/day/summary-view';
import { QuickAdd } from '@/components/dashboard/quick-add';

interface Entry {
  id: string;
  task: string;
  outcome: string;
  durationMinutes: number;
  category: string;
  isReconstructed: number;
  sortOrder: number;
}

interface DayLog {
  id: string;
  logDate: string;
  summary: string | null;
  observations: string | null;
  totalHighFocus: number;
  totalMedium: number;
  totalLowFocus: number;
  totalMeetings: number;
  totalInterruptions: number;
  totalPersonalMisc: number;
  isReconstructed: number;
  generatedAt: string | null;
  entries: Entry[];
}

export default function DayDetailPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = use(params);
  const router = useRouter();
  const [log, setLog] = useState<DayLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  async function fetchLog() {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs/${date}`);
      if (res.ok) {
        const data = await res.json();
        setLog(data.log);
      } else {
        setLog(null);
      }
    } catch {
      setLog(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLog();
  }, [date]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      await fetch(`/api/logs/${date}/summary`, { method: 'POST' });
      await fetchLog();
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(entryId: string) {
    if (!confirm('Delete this entry?')) return;
    await fetch(`/api/entries/${entryId}`, { method: 'DELETE' });
    await fetchLog();
  }

  async function handleEdit(entryId: string, data: EditPayload): Promise<boolean> {
    try {
      const res = await fetch(`/api/entries/${entryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchLog();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  const parsedDate = parseISO(date);
  const prevDate = format(subDays(parsedDate, 1), 'yyyy-MM-dd');
  const nextDate = format(addDays(parsedDate, 1), 'yyyy-MM-dd');
  const isToday = date === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="min-h-screen">
      {/* Reconstructed banner */}
      {log?.isReconstructed === 1 && (
        <div className="bg-secondary-container/10 border-b border-secondary-container/20 px-8 py-2.5 flex items-center justify-center gap-2 text-sm text-secondary-container">
          <AlertTriangle size={14} />
          This day was reconstructed from memory
        </div>
      )}

      <div className="p-12 max-w-7xl mx-auto">
        {/* Header with date nav */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push(`/day/${prevDate}`)} className="p-2 rounded-md hover:bg-surface-container-high text-on-surface-variant transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-on-surface tracking-tight">
                {format(parsedDate, 'EEEE, MMMM d, yyyy')}
              </h2>
            </div>
            <button onClick={() => router.push(`/day/${nextDate}`)} className="p-2 rounded-md hover:bg-surface-container-high text-on-surface-variant transition-colors">
              <ChevronRight size={20} />
            </button>
            {!isToday && (
              <button
                onClick={() => router.push(`/day/${format(new Date(), 'yyyy-MM-dd')}`)}
                className="ml-2 px-3 py-1 bg-primary text-on-primary rounded-md text-xs font-bold uppercase tracking-wider"
              >
                Today
              </button>
            )}
          </div>
          <QuickAdd forDate={date} onEntryAdded={() => fetchLog()} />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 bg-surface-container-lowest rounded-lg animate-pulse" />
              ))}
            </div>
            <div className="h-96 bg-surface-container-lowest rounded-lg animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Entry List */}
            <div className="lg:col-span-2 space-y-4">
              {log?.entries && log.entries.length > 0 ? (
                log.entries.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    {...entry}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              ) : (
                <div className="bg-surface-container-lowest rounded-lg p-12 text-center">
                  <p className="text-on-surface-variant text-sm">No entries logged for this day.</p>
                  <p className="text-on-surface-variant text-xs mt-2">Use Quick Add or the Check-In flow to get started.</p>
                </div>
              )}
            </div>

            {/* Right Sidebar: Breakdown + Summary */}
            <div className="space-y-8 lg:sticky lg:top-24">
              <div className="bg-surface-container-lowest rounded-lg p-6">
                <h4 className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-4">Time Allocation</h4>
                <TimeBreakdown
                  highFocus={log?.totalHighFocus ?? 0}
                  medium={log?.totalMedium ?? 0}
                  lowFocus={log?.totalLowFocus ?? 0}
                  meetings={log?.totalMeetings ?? 0}
                  interruptions={log?.totalInterruptions ?? 0}
                  personalMisc={log?.totalPersonalMisc ?? 0}
                />
              </div>

              <div className="bg-surface-container-lowest rounded-lg p-6">
                <SummaryView
                  summary={log?.summary ?? null}
                  observations={log?.observations ?? null}
                  generatedAt={log?.generatedAt ?? null}
                  onGenerate={handleGenerate}
                  generating={generating}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
