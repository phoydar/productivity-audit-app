'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, X, Tag, Calendar } from 'lucide-react';
import { format, subDays, parseISO, isAfter, startOfDay } from 'date-fns';

const DURATION_OPTIONS = ['15m', '30m', '45m', '1h', '1.5h', '2h', '3h', '4h+'];
const RETROACTIVE_LIMIT_DAYS = 30;
const CATEGORIES = [
  { value: 'DEEP_WORK', label: 'Deep Work', color: 'bg-primary-container' },
  { value: 'SHALLOW_WORK', label: 'Shallow', color: 'bg-secondary-container' },
  { value: 'MEETING', label: 'Meeting', color: 'bg-teal-500' },
  { value: 'INTERRUPTION', label: 'Interruption', color: 'bg-error' },
  { value: 'PERSONAL_MISC', label: 'Personal', color: 'bg-tertiary-container' },
];

const DEFAULT_TAGS = ['Code Review', 'Debugging', 'Architecture', 'Mentoring', 'Admin'];

function parseDuration(label: string): number {
  const map: Record<string, number> = {
    '15m': 15, '30m': 30, '45m': 45, '1h': 60, '1.5h': 90, '2h': 120, '3h': 180, '4h+': 240,
  };
  return map[label] ?? 60;
}

export function QuickAdd({ onEntryAdded, forDate }: { onEntryAdded?: () => void; forDate?: string }) {
  const [open, setOpen] = useState(false);
  const [task, setTask] = useState('');
  const [outcome, setOutcome] = useState('');
  const [duration, setDuration] = useState('1h');
  const [category, setCategory] = useState('DEEP_WORK');
  const [targetDate, setTargetDate] = useState(forDate ?? format(new Date(), 'yyyy-MM-dd'));
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const today = format(new Date(), 'yyyy-MM-dd');
  const minDate = format(subDays(new Date(), RETROACTIVE_LIMIT_DAYS), 'yyyy-MM-dd');
  const isRetroactive = targetDate !== today;

  // Sync if forDate prop changes (e.g. navigating between day pages)
  useEffect(() => {
    if (forDate) setTargetDate(forDate);
  }, [forDate]);

  const allTags = [...DEFAULT_TAGS, ...customTags];

  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagInput]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function addCustomTag() {
    const trimmed = newTag.trim();
    if (!trimmed) return;
    if (!allTags.includes(trimmed)) {
      setCustomTags((prev) => [...prev, trimmed]);
    }
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    setNewTag('');
    setShowTagInput(false);
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    } else if (e.key === 'Escape') {
      setNewTag('');
      setShowTagInput(false);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    // Validate date is within the 30-day window
    const parsedTarget = parseISO(targetDate);
    const earliest = startOfDay(subDays(new Date(), RETROACTIVE_LIMIT_DAYS));
    if (isAfter(earliest, parsedTarget)) {
      setError(`Can only log activities within the last ${RETROACTIVE_LIMIT_DAYS} days`);
      setLoading(false);
      return;
    }

    // Prepend tags to the task if any are selected
    const tagPrefix = selectedTags.length > 0 ? `[${selectedTags.join(', ')}] ` : '';
    const fullTask = tagPrefix + task;

    try {
      const res = await fetch(`/api/logs/${targetDate}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: fullTask,
          outcome,
          durationMinutes: parseDuration(duration),
          category,
          isReconstructed: targetDate !== format(new Date(), 'yyyy-MM-dd'),
        }),
      });
      if (res.ok) {
        setTask('');
        setOutcome('');
        setDuration('1h');
        setCategory('DEEP_WORK');
        setSelectedTags([]);
        if (!forDate) setTargetDate(format(new Date(), 'yyyy-MM-dd'));
        setOpen(false);
        onEntryAdded?.();
      } else {
        const data = await res.json();
        setError(data.issues?.[0] || data.error || 'Failed to add entry');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-md font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
      >
        <Plus size={16} />
        Quick Add
      </button>
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-lg p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-on-surface">Log Activity</h4>
        <button onClick={() => setOpen(false)} className="text-outline hover:text-on-surface">
          <X size={16} />
        </button>
      </div>

      {/* Date picker */}
      {!forDate && (
        <div className="flex items-center gap-3">
          <Calendar size={14} className="text-on-surface-variant shrink-0" />
          <input
            type="date"
            value={targetDate}
            min={minDate}
            max={today}
            onChange={(e) => setTargetDate(e.target.value)}
            className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
          />
          {isRetroactive && (
            <span className="text-xs font-medium text-secondary-container bg-secondary-container/10 px-2 py-0.5 rounded">
              Retroactive — will be marked as reconstructed
            </span>
          )}
        </div>
      )}

      <input
        type="text"
        placeholder="What did you work on? Be specific."
        value={task}
        onChange={(e) => setTask(e.target.value)}
        className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
      />

      <input
        type="text"
        placeholder="What was the result?"
        value={outcome}
        onChange={(e) => setOutcome(e.target.value)}
        className="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
      />

      {/* Tags */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Tag size={12} className="text-on-surface-variant" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Tags</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tag}
            </button>
          ))}
          {showTagInput ? (
            <div className="flex items-center gap-1">
              <input
                ref={tagInputRef}
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (!newTag.trim()) setShowTagInput(false); }}
                placeholder="Tag name..."
                className="w-24 px-2 py-1 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-xs focus:ring-1 focus:ring-primary focus:border-primary outline-none"
              />
              <button
                onClick={addCustomTag}
                disabled={!newTag.trim()}
                className="p-1 text-primary hover:text-primary-container disabled:opacity-30 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-surface-container text-on-surface-variant hover:bg-surface-container-high border border-dashed border-outline-variant/30 transition-colors"
            >
              <Plus size={10} />
              New Tag
            </button>
          )}
        </div>
      </div>

      {/* Duration */}
      <div className="flex flex-wrap gap-2">
        {DURATION_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setDuration(opt)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              duration === opt
                ? 'bg-primary text-on-primary'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="flex gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              category === cat.value
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
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-on-primary rounded-md font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
        >
          {loading ? 'Saving...' : 'Save Activity'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
