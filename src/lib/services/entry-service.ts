import { db } from '@/lib/db';
import { dailyLog, logEntry } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { checkEntryQuality } from '@/lib/quality';
import { getOrCreateLog } from './log-service';

interface CreateEntryInput {
  task: string;
  outcome: string;
  durationMinutes: number;
  categoryId: string;
  isReconstructed?: boolean;
}

interface UpdateEntryInput {
  task?: string;
  outcome?: string;
  durationMinutes?: number;
  categoryId?: string;
  sortOrder?: number;
  date?: string;
}

export async function createEntry(date: string, input: CreateEntryInput) {
  const quality = checkEntryQuality(input.task, input.outcome);
  if (!quality.passed) {
    return { success: false as const, issues: quality.issues };
  }

  const log = await getOrCreateLog(date);
  if (!log) throw new Error('Failed to create daily log');

  const existing = await db.query.logEntry.findMany({
    where: eq(logEntry.dailyLogId, log.id),
  });
  const nextOrder = existing.length;

  const id = createId();
  await db.insert(logEntry).values({
    id,
    dailyLogId: log.id,
    task: input.task,
    outcome: input.outcome,
    durationMinutes: input.durationMinutes,
    categoryId: input.categoryId,
    sortOrder: nextOrder,
    isReconstructed: input.isReconstructed ?? false,
  });

  const entry = await db.query.logEntry.findFirst({
    where: eq(logEntry.id, id),
    with: { category: true },
  });
  return { success: true as const, entry };
}

export async function updateEntry(id: string, input: UpdateEntryInput) {
  const existing = await db.query.logEntry.findFirst({ where: eq(logEntry.id, id) });
  if (!existing) return null;

  if (input.task || input.outcome) {
    const task = input.task ?? existing.task;
    const outcome = input.outcome ?? existing.outcome;
    const quality = checkEntryQuality(task, outcome);
    if (!quality.passed) {
      return { success: false as const, issues: quality.issues };
    }
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (input.task !== undefined) updateData.task = input.task;
  if (input.outcome !== undefined) updateData.outcome = input.outcome;
  if (input.durationMinutes !== undefined) updateData.durationMinutes = input.durationMinutes;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

  // Handle date change: move entry to a different daily log
  const oldLog = await db.query.dailyLog.findFirst({
    where: eq(dailyLog.id, existing.dailyLogId),
  });
  const oldDate = oldLog?.logDate;

  if (input.date && oldDate && input.date !== oldDate) {
    const targetLog = await getOrCreateLog(input.date);
    if (!targetLog) throw new Error('Failed to create daily log for target date');
    updateData.dailyLogId = targetLog.id;

    // Set sort order to end of target day's entries
    const targetEntries = await db.query.logEntry.findMany({
      where: eq(logEntry.dailyLogId, targetLog.id),
    });
    updateData.sortOrder = targetEntries.length;
  }

  await db.update(logEntry).set(updateData).where(eq(logEntry.id, id));

  const updated = await db.query.logEntry.findFirst({
    where: eq(logEntry.id, id),
    with: { category: true },
  });
  return { success: true as const, entry: updated };
}

export async function deleteEntry(id: string) {
  const existing = await db.query.logEntry.findFirst({ where: eq(logEntry.id, id) });
  if (!existing) return false;

  await db.delete(logEntry).where(eq(logEntry.id, id));
  return true;
}

export async function getEntriesForDate(date: string) {
  const log = await db.query.dailyLog.findFirst({
    where: eq(dailyLog.logDate, date),
  });
  if (!log) return [];

  return db.query.logEntry.findMany({
    where: eq(logEntry.dailyLogId, log.id),
    orderBy: (entries, { asc }) => [asc(entries.sortOrder)],
    with: { category: true },
  });
}
