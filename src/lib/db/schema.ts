import { pgTable, pgEnum, text, integer, boolean, doublePrecision, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const categoryEnum = pgEnum('category', ['HIGH_FOCUS', 'MEDIUM', 'LOW_FOCUS', 'MEETING', 'INTERRUPTION', 'PERSONAL_MISC']);
export const insightTypeEnum = pgEnum('insight_type', ['TREND', 'THRESHOLD', 'SUGGESTION']);
export const insightSeverityEnum = pgEnum('insight_severity', ['INFO', 'WARNING']);
export const todoStatusEnum = pgEnum('todo_status', ['PENDING', 'COMPLETED', 'CANCELLED']);

export const dailyLog = pgTable(
  'daily_log',
  {
    id: text('id').primaryKey(),
    logDate: text('log_date').notNull().unique(),
    summary: text('summary'),
    observations: text('observations'),
    totalHighFocus: doublePrecision('total_high_focus').default(0).notNull(),
    totalMedium: doublePrecision('total_medium').default(0).notNull(),
    totalLowFocus: doublePrecision('total_low_focus').default(0).notNull(),
    totalMeetings: doublePrecision('total_meetings').default(0).notNull(),
    totalInterruptions: doublePrecision('total_interruptions').default(0).notNull(),
    totalPersonalMisc: doublePrecision('total_personal_misc').default(0).notNull(),
    isReconstructed: boolean('is_reconstructed').default(false).notNull(),
    generatedAt: text('generated_at'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`now()`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    uniqueIndex('idx_daily_log_date').on(table.logDate),
  ],
);

export const logEntry = pgTable(
  'log_entry',
  {
    id: text('id').primaryKey(),
    dailyLogId: text('daily_log_id').notNull(),
    task: text('task').notNull(),
    outcome: text('outcome').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    category: categoryEnum('category').notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isReconstructed: boolean('is_reconstructed').default(false).notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`now()`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('idx_entry_daily_log').on(table.dailyLogId),
    index('idx_entry_category').on(table.category),
  ],
);

export const tag = pgTable('tag', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`now()`),
});

export const entryTag = pgTable(
  'entry_tag',
  {
    entryId: text('entry_id').notNull(),
    tagId: text('tag_id').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.entryId, table.tagId] }),
    index('idx_entry_tag_entry').on(table.entryId),
    index('idx_entry_tag_tag').on(table.tagId),
  ],
);

export const insight = pgTable(
  'insight',
  {
    id: text('id').primaryKey(),
    insightDate: text('insight_date').notNull(),
    type: insightTypeEnum('type').notNull(),
    message: text('message').notNull(),
    severity: insightSeverityEnum('severity').notNull(),
    metadata: text('metadata'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('idx_insight_date').on(table.insightDate),
  ],
);

export const todo = pgTable(
  'todo',
  {
    id: text('id').primaryKey(),
    task: text('task').notNull(),
    category: categoryEnum('category').notNull(),
    estimatedMinutes: integer('estimated_minutes').notNull(),
    priority: integer('priority').default(0).notNull(),
    tags: text('tags'),
    status: todoStatusEnum('status').default('PENDING').notNull(),
    completedAt: text('completed_at'),
    logEntryId: text('log_entry_id'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`now()`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('idx_todo_status').on(table.status),
    index('idx_todo_created').on(table.createdAt),
  ],
);

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

// Relations
export const dailyLogRelations = relations(dailyLog, ({ many }) => ({
  entries: many(logEntry),
  insights: many(insight),
}));

export const logEntryRelations = relations(logEntry, ({ one, many }) => ({
  dailyLog: one(dailyLog, {
    fields: [logEntry.dailyLogId],
    references: [dailyLog.id],
  }),
  tags: many(entryTag),
}));

export const tagRelations = relations(tag, ({ many }) => ({
  entries: many(entryTag),
}));

export const entryTagRelations = relations(entryTag, ({ one }) => ({
  entry: one(logEntry, {
    fields: [entryTag.entryId],
    references: [logEntry.id],
  }),
  tag: one(tag, {
    fields: [entryTag.tagId],
    references: [tag.id],
  }),
}));

export const insightRelations = relations(insight, ({ one }) => ({
  dailyLog: one(dailyLog, {
    fields: [insight.insightDate],
    references: [dailyLog.logDate],
  }),
}));

export const todoRelations = relations(todo, ({ one }) => ({
  logEntry: one(logEntry, {
    fields: [todo.logEntryId],
    references: [logEntry.id],
  }),
}));

export const settingsRelations = relations(settings, () => ({}));
