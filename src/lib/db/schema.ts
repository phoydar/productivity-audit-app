import { pgTable, pgEnum, text, integer, boolean, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { sql, relations } from 'drizzle-orm';

export const insightTypeEnum = pgEnum('insight_type', ['TREND', 'THRESHOLD', 'SUGGESTION']);
export const insightSeverityEnum = pgEnum('insight_severity', ['INFO', 'WARNING']);
export const todoStatusEnum = pgEnum('todo_status', ['PENDING', 'COMPLETED', 'CANCELLED']);

export const category = pgTable(
  'category',
  {
    id: text('id').primaryKey(),
    userId: text('user_id'), // null = system default; populated when users exist
    name: text('name').notNull(),
    color: text('color').notNull().default('#6366f1'),
    icon: text('icon'),
    isFocusType: boolean('is_focus_type').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: text('created_at')
      .notNull()
      .default(sql`now()`),
  },
  (table) => [
    index('idx_category_user').on(table.userId),
    index('idx_category_sort').on(table.sortOrder),
  ],
);

export const dailyLog = pgTable(
  'daily_log',
  {
    id: text('id').primaryKey(),
    logDate: text('log_date').notNull().unique(),
    summary: text('summary'),
    observations: text('observations'),
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
    categoryId: text('category_id').notNull(),
    task: text('task').notNull(),
    outcome: text('outcome').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
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
    index('idx_entry_category').on(table.categoryId),
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
    categoryId: text('category_id').notNull(),
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
export const categoryRelations = relations(category, ({ many }) => ({
  entries: many(logEntry),
  todos: many(todo),
}));

export const dailyLogRelations = relations(dailyLog, ({ many }) => ({
  entries: many(logEntry),
  insights: many(insight),
}));

export const logEntryRelations = relations(logEntry, ({ one, many }) => ({
  dailyLog: one(dailyLog, {
    fields: [logEntry.dailyLogId],
    references: [dailyLog.id],
  }),
  category: one(category, {
    fields: [logEntry.categoryId],
    references: [category.id],
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
  category: one(category, {
    fields: [todo.categoryId],
    references: [category.id],
  }),
  logEntry: one(logEntry, {
    fields: [todo.logEntryId],
    references: [logEntry.id],
  }),
}));

export const settingsRelations = relations(settings, () => ({}));
