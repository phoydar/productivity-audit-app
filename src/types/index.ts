export type InsightType = 'TREND' | 'THRESHOLD' | 'SUGGESTION';
export type SeverityType = 'INFO' | 'WARNING';

export interface Category {
  id: string;
  userId: string | null;
  name: string;
  color: string;
  icon: string | null;
  isFocusType: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  color: string;
  isFocusType: boolean;
  totalHours: number;
}

export interface DailyLog {
  id: string;
  logDate: string;
  summary: string | null;
  observations: string | null;
  isReconstructed: boolean;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  entries?: LogEntry[];
  breakdown?: CategoryBreakdown[];
}

export interface LogEntry {
  id: string;
  dailyLogId: string;
  categoryId: string;
  category: Category;
  task: string;
  outcome: string;
  durationMinutes: number;
  sortOrder: number;
  isReconstructed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id: string;
  insightDate: string;
  type: InsightType;
  message: string;
  severity: SeverityType;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface DailySummary {
  summary: string;
  workLog: LogEntry[];
  breakdown: CategoryBreakdown[];
  observations: string;
}

export interface CheckinState {
  date: string;
  step: number;
  mode: 'standard' | 'reconstruct';
  responses: Record<number, string>;
  entries: Partial<LogEntry>[];
}

export type TodoStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED';

export interface Todo {
  id: string;
  task: string;
  categoryId: string;
  category?: Category;
  estimatedMinutes: number;
  priority: number;
  tags: string[] | null;
  status: TodoStatus;
  completedAt: string | null;
  logEntryId: string | null;
  createdAt: string;
  updatedAt: string;
}
