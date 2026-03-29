'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';

interface EntryCardProps {
  id: string;
  task: string;
  outcome: string;
  durationMinutes: number;
  category: string;
  isReconstructed?: number;
  onEdit?: (id: string, data: EditPayload) => Promise<boolean>;
  onDelete?: (id: string) => void;
}

export interface EditPayload {
  task?: string;
  outcome?: string;
  durationMinutes?: number;
  category?: string;
}

const CATEGORY_STYLES: Record<string, { label: string; border: string; badge: string; text: string }> = {
  HIGH_FOCUS: { label: 'High Focus', border: 'border-l-primary-container', badge: 'bg-primary-container/10 text-primary-container', text: 'text-primary-container' },
  MEDIUM: { label: 'Medium', border: 'border-l-indigo-400', badge: 'bg-indigo-500/10 text-indigo-500', text: 'text-indigo-500' },
  LOW_FOCUS: { label: 'Low Focus', border: 'border-l-secondary-container', badge: 'bg-secondary-container/10 text-secondary-container', text: 'text-secondary-container' },
  MEETING: { label: 'Meeting', border: 'border-l-teal-500', badge: 'bg-teal-500/10 text-teal-600', text: 'text-teal-600' },
  INTERRUPTION: { label: 'Interruption', border: 'border-l-error', badge: 'bg-error/10 text-error', text: 'text-error' },
  PERSONAL_MISC: { label: 'Personal', border: 'border-l-tertiary-container', badge: 'bg-tertiary-container/10 text-tertiary-container', text: 'text-tertiary-container' },
};

const CATEGORIES = [
  { value: 'HIGH_FOCUS', label: 'High Focus', color: 'bg-primary-container' },
  { value: 'MEDIUM', label: 'Medium', color: 'bg-indigo-500' },
  { value: 'LOW_FOCUS', label: 'Low Focus', color: 'bg-secondary-container' },
  { value: 'MEETING', label: 'Meeting', color: 'bg-teal-500' },
  { value: 'INTERRUPTION', label: 'Interruption', color: 'bg-error' },
  { value: 'PERSONAL_MISC', label: 'Personal', color: 'bg-tertiary-container' },
];

const DURATION_OPTIONS = ['15m', '30m', '45m', '1h', '1.5h', '2h', '3h', '4h+'];

function parseDuration(label: string): number {
  const map: Record<string, number> = {
    '15m': 15, '30m': 30, '45m': 45, '1h': 60, '1.5h': 90, '2h': 120, '3h': 180, '4h+': 240,
  };
  return map[label] ?? 60;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function minutesToDurationLabel(minutes: number): string {
  const map: Record<number, string> = {
    15: '15m', 30: '30m', 45: '45m', 60: '1h', 90: '1.5h', 120: '2h', 180: '3h', 240: '4h+',
  };
  return map[minutes] ?? '1h';
}

export function EntryCard({ id, task, outcome, durationMinutes, category, isReconstructed, onEdit, onDelete }: EntryCardProps) {
  const style = CATEGORY_STYLES[category] ?? CATEGORY_STYLES.DEEP_WORK;

  const [editing, setEditing] = useState(false);
  const [editTask, setEditTask] = useState(task);
  const [editOutcome, setEditOutcome] = useState(outcome);
  const [editDuration, setEditDuration] = useState(minutesToDurationLabel(durationMinutes));
  const [editCategory, setEditCategory] = useState(category);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setEditTask(task);
    setEditOutcome(outcome);
    setEditDuration(minutesToDurationLabel(durationMinutes));
    setEditCategory(category);
    setError(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setError(null);
  }

  async function saveEdit() {
    if (!onEdit) return;
    setSaving(true);
    setError(null);

    const payload: EditPayload = {};
    if (editTask !== task) payload.task = editTask;
    if (editOutcome !== outcome) payload.outcome = editOutcome;
    const newMinutes = parseDuration(editDuration);
    if (newMinutes !== durationMinutes) payload.durationMinutes = newMinutes;
    if (editCategory !== category) payload.category = editCategory;

    if (Object.keys(payload).length === 0) {
      setEditing(false);
      setSaving(false);
      return;
    }

    const success = await onEdit(id, payload);
    setSaving(false);
    if (success) {
      setEditing(false);
    } else {
      setError('Failed to save — check field lengths');
    }
  }

  if (editing) {
    const editStyle = CATEGORY_STYLES[editCategory] ?? CATEGORY_STYLES.DEEP_WORK;

    return (
      <div className={`bg-surface-container-lowest rounded-lg border-l-4 ${editStyle.border} p-5 space-y-3`}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Edit Entry</span>
          <button onClick={cancelEditing} className="text-outline hover:text-on-surface transition-colors">
            <X size={16} />
          </button>
        </div>

        <input
          type="text"
          value={editTask}
          onChange={(e) => setEditTask(e.target.value)}
          placeholder="What did you work on?"
          className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
          autoFocus
        />

        <input
          type="text"
          value={editOutcome}
          onChange={(e) => setEditOutcome(e.target.value)}
          placeholder="What was the result?"
          className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
        />

        {/* Duration */}
        <div className="flex flex-wrap gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt}
              onClick={() => setEditDuration(opt)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                editDuration === opt
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Category */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setEditCategory(cat.value)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                editCategory === cat.value
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cat.color}`} />
              {cat.label}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={saveEdit}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-primary text-on-primary rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Check size={14} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={cancelEditing}
            className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

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
            <button onClick={startEditing} className="p-1.5 rounded hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors">
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
