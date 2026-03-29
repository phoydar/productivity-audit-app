export type CategoryType = 'HIGH_FOCUS' | 'MEDIUM' | 'LOW_FOCUS' | 'MEETING' | 'INTERRUPTION' | 'PERSONAL_MISC';

export type InsightType = 'TREND' | 'THRESHOLD' | 'SUGGESTION';
export type SeverityType = 'INFO' | 'WARNING';

export interface DailyLog {
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
  isReconstructed: boolean;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  entries?: LogEntry[];
}

export interface LogEntry {
  id: string;
  dailyLogId: string;
  task: string;
  outcome: string;
  durationMinutes: number;
  category: CategoryType;
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

export interface TimeBreakdown {
  highFocus: number;
  medium: number;
  lowFocus: number;
  meetings: number;
  interruptions: number;
  personalMisc: number;
  total: number;
}

export interface DailySummary {
  summary: string;
  workLog: LogEntry[];
  timeBreakdown: TimeBreakdown;
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
  category: CategoryType;
  estimatedMinutes: number;
  priority: number;
  tags: string[] | null;
  status: TodoStatus;
  completedAt: string | null;
  logEntryId: string | null;
  createdAt: string;
  updatedAt: string;
}
