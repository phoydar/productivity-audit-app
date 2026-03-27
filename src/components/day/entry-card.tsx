'use client';

import { Pencil, Trash2, GripVertical } from 'lucide-react';

interface EntryCardProps {
  id: string;
  task: string;
  outcome: string;
  durationMinutes: number;
  category: string;
  isReconstructed?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const CATEGORY_STYLES: Record<string, { label: string; border: string; badge: string; text: string }> = {
  DEEP_WORK: { label: 'Deep Work', border: 'border-l-primary-container', badge: 'bg-primary-container/10 text-primary-container', text: 'text-primary-container' },
  SHALLOW_WORK: { label: 'Shallow Work', border: 'border-l-secondary-container', badge: 'bg-secondary-container/10 text-secondary-container', text: 'text-secondary-container' },
  INTERRUPTION: { label: 'Interruption', border: 'border-l-error', badge: 'bg-error/10 text-error', text: 'text-error' },
  PERSONAL_MISC: { label: 'Personal', border: 'border-l-tertiary-container', badge: 'bg-tertiary-container/10 text-tertiary-container', text: 'text-tertiary-container' },
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function EntryCard({ id, task, outcome, durationMinutes, category, isReconstructed, onEdit, onDelete }: EntryCardProps) {
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.DEEP_WORK;

  return (
    <div className={`group bg-surface-container-lowest rounded-lg border-l-4 ${style.border} p-5 hover:shadow-[0_0_32px_rgba(0,74,198,0.06)] transition-all`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="text-sm font-semibold text-on-surface truncate">{task}</h4>
            <span className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap ${style.badge}`}>
              {style.label}
            </span>
          </div>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{outcome}</p>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">
              {formatDuration(durationMinutes)}
            </span>
            {isReconstructed === 1 && (
              <span className="text-[10px] uppercase tracking-wider text-outline font-medium">Reconstructed</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={() => onEdit(id)} className="p-1.5 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors">
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(id)} className="p-1.5 rounded hover:bg-error-container text-outline hover:text-error transition-colors">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
