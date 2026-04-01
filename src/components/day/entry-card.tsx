'use client';

import { useState } from 'react';
import { Pencil, Trash2, Check, X, Calendar } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';
import { MarkdownEditor, MarkdownDisplay } from '@/components/markdown-editor';

interface CategoryInfo {
  id: string;
  name: string;
  color: string;
  isFocusType: boolean;
}

interface EntryCardProps {
  id: string;
  task: string;
  outcome: string;
  durationMinutes: number;
  category: CategoryInfo;
  date: string;
  isReconstructed?: boolean | number;
  onEdit?: (id: string, data: EditPayload) => Promise<boolean>;
  onDelete?: (id: string) => void;
}

export interface EditPayload {
  task?: string;
  outcome?: string;
  durationMinutes?: number;
  categoryId?: string;
  date?: string;
}

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

export function EntryCard({ id, task, outcome, durationMinutes, category, date, isReconstructed, onEdit, onDelete }: EntryCardProps) {
  const { categories } = useCategories();

  const [editing, setEditing] = useState(false);
  const [editTask, setEditTask] = useState(task);
  const [editOutcome, setEditOutcome] = useState(outcome);
  const [editDuration, setEditDuration] = useState(minutesToDurationLabel(durationMinutes));
  const [editCategoryId, setEditCategoryId] = useState(category.id);
  const [editDate, setEditDate] = useState(date);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEditing() {
    setEditTask(task);
    setEditOutcome(outcome);
    setEditDuration(minutesToDurationLabel(durationMinutes));
    setEditCategoryId(category.id);
    setEditDate(date);
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
    if (editCategoryId !== category.id) payload.categoryId = editCategoryId;
    if (editDate !== date) payload.date = editDate;

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

  const editingCategory = categories.find((c) => c.id === editCategoryId) ?? category;

  if (editing) {
    return (
      <div
        className="bg-surface-container-lowest rounded-lg border-l-4 p-5 space-y-3"
        style={{ borderLeftColor: editingCategory.color }}
      >
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

        <MarkdownEditor
          value={editOutcome}
          onChange={setEditOutcome}
          placeholder="What was the result?"
          minHeight={100}
        />

        {/* Date */}
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-on-surface-variant" />
          <input
            type="date"
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            className="px-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
          />
        </div>

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

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setEditCategoryId(cat.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                editCategoryId === cat.id
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
              {cat.name}
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
    <div
      className="group bg-surface-container-lowest rounded-lg border-l-4 p-5 hover:shadow-[0_0_32px_rgba(0,74,198,0.06)] transition-all"
      style={{ borderLeftColor: category.color }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h4 className="text-sm font-semibold text-on-surface truncate">{task}</h4>
            <span
              className="text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap text-white"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </span>
          </div>
          <MarkdownDisplay content={outcome} className="mb-3" />
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-2 py-1 rounded">
              {formatDuration(durationMinutes)}
            </span>
            {(isReconstructed === 1 || isReconstructed === true) && (
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
