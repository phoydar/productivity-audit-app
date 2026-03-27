import { sqliteTable, text, integer, real, primaryKey, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql, relations } from 'drizzle-orm';

export const dailyLog = sqliteTable(
  'daily_log',
  {
    id: text('id').primaryKey(),
    logDate: text('log_date').notNull().unique(),
    summary: text('summary'),
    observations: text('observations'),
    totalDeepWork: real('total_deep_work').default(0).notNull(),
    totalShallowWork: real('total_shallow_work').default(0).notNull(),
    totalMeetings: real('total_meetings').default(0).notNull(),
    totalInterruptions: real('total_interruptions').default(0).notNull(),
    totalPersonalMisc: real('total_personal_misc').default(0).notNull(),
    isReconstructed: integer('is_reconstructed', { mode: 'boolean' }).default(false).notNull(),
    generatedAt: text('generated_at'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex('idx_daily_log_date').on(table.logDate),
  ],
);

export const logEntry = sqliteTable(
  'log_entry',
  {
    id: text('id').primaryKey(),
    dailyLogId: text('daily_log_id').notNull(),
    task: text('task').notNull(),
    outcome: text('outcome').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    category: text('category', { enum: ['DEEP_WORK', 'SHALLOW_WORK', 'MEETING', 'INTERRUPTION', 'PERSONAL_MISC'] }).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isReconstructed: integer('is_reconstructed', { mode: 'boolean' }).default(false).notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_entry_daily_log').on(table.dailyLogId),
    index('idx_entry_category').on(table.category),
  ],
);

export const tag = sqliteTable('tag', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const entryTag = sqliteTable(
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

export const insight = sqliteTable(
  'insight',
  {
    id: text('id').primaryKey(),
    insightDate: text('insight_date').notNull(),
    type: text('type', { enum: ['TREND', 'THRESHOLD', 'SUGGESTION'] }).notNull(),
    message: text('message').notNull(),
    severity: text('severity', { enum: ['INFO', 'WARNING'] }).notNull(),
    metadata: text('metadata'), // JSON string
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_insight_date').on(table.insightDate),
  ],
);

export const todo = sqliteTable(
  'todo',
  {
    id: text('id').primaryKey(),
    task: text('task').notNull(),
    category: text('category', { enum: ['DEEP_WORK', 'SHALLOW_WORK', 'MEETING', 'INTERRUPTION', 'PERSONAL_MISC'] }).notNull(),
    estimatedMinutes: integer('estimated_minutes').notNull(),
    priority: integer('priority').default(0).notNull(), // 0=normal, 1=high
    tags: text('tags'), // JSON array string
    status: text('status', { enum: ['PENDING', 'COMPLETED', 'CANCELLED'] }).default('PENDING').notNull(),
    completedAt: text('completed_at'),
    logEntryId: text('log_entry_id'), // links to created entry on completion
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text('updated_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('idx_todo_status').on(table.status),
    index('idx_todo_created').on(table.createdAt),
  ],
);

export const settings = sqliteTable('settings', {
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
