'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, Plus, X, CircleDot, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useCategories } from '@/hooks/use-categories';

const DURATION_OPTIONS = ['15m', '30m', '45m', '1h', '1.5h', '2h', '3h', '4h+'];

function parseDuration(label: string): number {
  const map: Record<string, number> = {
    '15m': 15, '30m': 30, '45m': 45, '1h': 60, '1.5h': 90, '2h': 120, '3h': 180, '4h+': 240,
  };
  return map[label] ?? 60;
}

function formatMinutes(m: number): string {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

interface CategoryInfo {
  id: string;
  name: string;
  color: string;
}

interface TodoItem {
  id: string;
  task: string;
  categoryId: string;
  category: CategoryInfo;
  estimatedMinutes: number;
  priority: number;
  tags: string | null;
  status: string;
  completedAt: string | null;
  logEntryId: string | null;
  createdAt: string;
}

interface CompletingState {
  todoId: string;
  outcome: string;
  actualMinutes: string;
}

export function TodoPanel({ onTodoCompleted }: { onTodoCompleted?: () => void }) {
  const { categories } = useCategories();
  const defaultCategoryId = categories[0]?.id ?? 'sys_high_focus';

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completing, setCompleting] = useState<CompletingState | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [newTask, setNewTask] = useState('');
  const [newCategoryId, setNewCategoryId] = useState(defaultCategoryId);
  const [newDuration, setNewDuration] = useState('1h');
  const [newPriority, setNewPriority] = useState(0);
  const [addLoading, setAddLoading] = useState(false);

  const outcomeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  useEffect(() => {
    if (completing && outcomeRef.current) {
      outcomeRef.current.focus();
    }
  }, [completing]);

  // Sync default category once loaded
  useEffect(() => {
    if (categories.length > 0 && newCategoryId === 'sys_high_focus') {
      setNewCategoryId(categories[0].id);
    }
  }, [categories]);

  async function fetchTodos() {
    try {
      const res = await fetch('/api/todos');
      if (res.ok) {
        const { todos: data } = await res.json();
        setTodos(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newTask.trim()) return;
    setAddLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task: newTask,
          categoryId: newCategoryId,
          estimatedMinutes: parseDuration(newDuration),
          priority: newPriority,
        }),
      });
      if (res.ok) {
        setNewTask('');
        setNewCategoryId(categories[0]?.id ?? 'sys_high_focus');
        setNewDuration('1h');
        setNewPriority(0);
        setShowAdd(false);
        await fetchTodos();
      } else {
        const data = await res.json();
        setError(data.error?.[0]?.message || data.error || 'Failed to add todo');
      }
    } catch {
      setError('Network error');
    } finally {
      setAddLoading(false);
    }
  }

  async function handleComplete() {
    if (!completing || !completing.outcome.trim()) return;
    setError(null);
    try {
      const body: Record<string, unknown> = { outcome: completing.outcome };
      if (completing.actualMinutes) {
        body.actualMinutes = parseDuration(completing.actualMinutes);
      }
      const res = await fetch(`/api/todos/${completing.todoId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setCompleting(null);
        await fetchTodos();
        onTodoCompleted?.();
      } else {
        const data = await res.json();
        setError(data.issues?.[0] || data.error || 'Failed to complete todo');
      }
    } catch {
      setError('Network error');
    }
  }

  async function handleDelete(id: string) {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      await fetchTodos();
    } catch {
      // silent
    }
  }

  const pending = todos.filter((t) => t.status === 'PENDING');
  const completed = todos.filter((t) => t.status === 'COMPLETED');

  if (loading) {
    return <div className="bg-surface-container-lowest rounded-lg p-6 animate-pulse h-48" />;
  }

  return (
    <div className="bg-surface-container-lowest rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-tighter">To-Do</h3>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {pending.length} pending{completed.length > 0 ? ` · ${completed.length} done today` : ''}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
        >
          <Plus size={12} />
          Add
        </button>
      </div>

      {showAdd && (
        <div className="mb-6 p-4 bg-surface-container-low rounded-lg space-y-3">
          <input
            type="text"
            placeholder="What needs to be done?"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
            autoFocus
          />

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setNewCategoryId(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  newCategoryId === cat.id
                    ? 'bg-on-surface text-surface'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setNewDuration(opt)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  newDuration === opt
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setNewPriority(newPriority === 1 ? 0 : 1)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                newPriority === 1
                  ? 'bg-error/10 text-error'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <CircleDot size={12} />
              {newPriority === 1 ? 'High Priority' : 'Normal Priority'}
            </button>

            <div className="flex gap-2">
              <button
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                disabled={addLoading || !newTask.trim()}
                className="px-4 py-1.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {addLoading ? 'Adding...' : 'Add Todo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-error mb-4">{error}</p>}

      {pending.length === 0 && !showAdd && (
        <p className="text-sm text-on-surface-variant py-4 text-center">No tasks queued up. Nice.</p>
      )}

      <div className="space-y-2">
        {pending.map((item) => {
          const cat = item.category;
          const isCompleting = completing?.todoId === item.id;

          return (
            <div key={item.id} className="group">
              <div className="flex items-start gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-container-low/50 transition-colors">
                <button
                  onClick={() =>
                    isCompleting
                      ? setCompleting(null)
                      : setCompleting({ todoId: item.id, outcome: '', actualMinutes: '' })
                  }
                  className="mt-0.5 w-5 h-5 rounded-full border-2 border-outline-variant/40 hover:border-primary flex items-center justify-center flex-shrink-0 transition-colors"
                >
                  {isCompleting && <div className="w-2 h-2 rounded-full bg-primary" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                    <p className="text-sm text-on-surface truncate">{item.task}</p>
                    {item.priority === 1 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-error flex-shrink-0">!</span>
                    )}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5 ml-3.5">
                    {cat.name} · {formatMinutes(item.estimatedMinutes)}
                  </p>
                </div>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-outline hover:text-error transition-all flex-shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {isCompleting && (
                <div className="ml-8 mt-1 mb-2 p-3 bg-surface-container-low rounded-lg space-y-2">
                  <input
                    ref={outcomeRef}
                    type="text"
                    placeholder="What was the result?"
                    value={completing.outcome}
                    onChange={(e) => setCompleting({ ...completing, outcome: e.target.value })}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleComplete(); if (e.key === 'Escape') setCompleting(null); }}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/20 rounded-md text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-xs text-on-surface-variant mr-1 leading-7">Actual:</span>
                      {DURATION_OPTIONS.map((opt) => (
                        <button
                          key={opt}
                          onClick={() => setCompleting({ ...completing, actualMinutes: completing.actualMinutes === opt ? '' : opt })}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                            completing.actualMinutes === opt
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={handleComplete}
                      disabled={!completing.outcome.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-on-primary rounded-md text-xs font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
                    >
                      <Check size={12} />
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div className="mt-4 pt-4">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-1.5 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          >
            {showCompleted ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {completed.length} completed
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-1">
              {completed.map((item) => {
                const cat = item.category;
                return (
                  <div key={item.id} className="flex items-center gap-3 py-1.5 px-3">
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check size={12} className="text-primary" />
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                      <p className="text-sm text-on-surface-variant line-through truncate">{item.task}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
