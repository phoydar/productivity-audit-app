import { z } from 'zod';

export const categorySchema = z.enum(['HIGH_FOCUS', 'MEDIUM', 'LOW_FOCUS', 'MEETING', 'INTERRUPTION', 'PERSONAL_MISC']);

export const createEntrySchema = z.object({
  task: z.string().min(10, 'Task description must be at least 10 characters'),
  outcome: z.string().min(5, 'Outcome must be at least 5 characters'),
  durationMinutes: z.number().int().min(15, 'Minimum duration is 15 minutes').max(720, 'Maximum duration is 12 hours'),
  category: categorySchema,
  isReconstructed: z.boolean().optional().default(false),
});

export const updateEntrySchema = z.object({
  task: z.string().min(10).optional(),
  outcome: z.string().min(5).optional(),
  durationMinutes: z.number().int().min(15).max(720).optional(),
  category: categorySchema.optional(),
  sortOrder: z.number().int().optional(),
});

export const updateLogSchema = z.object({
  summary: z.string().optional(),
  observations: z.string().optional(),
});

export const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');

export const dateRangeSchema = z.object({
  from: dateParamSchema.optional(),
  to: dateParamSchema.optional(),
});

export const checkinStartSchema = z.object({
  date: dateParamSchema.optional(),
  mode: z.enum(['standard', 'reconstruct']).optional().default('standard'),
});

export const checkinRespondSchema = z.object({
  step: z.number().int().min(0).max(4),
  response: z.string().min(1, 'Response cannot be empty'),
});

export const settingsSchema = z.object({
  highFocusTargetHours: z.number().min(0).max(12).optional(),
  interruptionWarningPct: z.number().min(0).max(100).optional(),
  expectedWorkHours: z.number().min(1).max(24).optional(),
});

export const createTodoSchema = z.object({
  task: z.string().min(5, 'Task must be at least 5 characters'),
  category: categorySchema,
  estimatedMinutes: z.number().int().min(15).max(720),
  priority: z.number().int().min(0).max(1).optional().default(0),
  tags: z.array(z.string()).optional(),
});

export const updateTodoSchema = z.object({
  task: z.string().min(5).optional(),
  category: categorySchema.optional(),
  estimatedMinutes: z.number().int().min(15).max(720).optional(),
  priority: z.number().int().min(0).max(1).optional(),
  tags: z.array(z.string()).optional(),
});

export const completeTodoSchema = z.object({
  outcome: z.string().min(5, 'Outcome must be at least 5 characters'),
  actualMinutes: z.number().int().min(15).max(720).optional(),
});
