import { db } from '@/lib/db';
import { todo } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { createEntry } from './entry-service';
import { format } from 'date-fns';

interface CreateTodoInput {
  task: string;
  categoryId: string;
  estimatedMinutes: number;
  priority?: number;
  tags?: string[];
}

interface UpdateTodoInput {
  task?: string;
  categoryId?: string;
  estimatedMinutes?: number;
  priority?: number;
  tags?: string[];
}

interface CompleteTodoInput {
  outcome: string;
  actualMinutes?: number;
}

export async function createTodo(input: CreateTodoInput) {
  const id = createId();
  await db.insert(todo).values({
    id,
    task: input.task,
    categoryId: input.categoryId,
    estimatedMinutes: input.estimatedMinutes,
    priority: input.priority ?? 0,
    tags: input.tags ? JSON.stringify(input.tags) : null,
    status: 'PENDING',
  });

  return db.query.todo.findFirst({
    where: eq(todo.id, id),
    with: { category: true },
  });
}

export async function getTodos(status?: 'PENDING' | 'COMPLETED' | 'CANCELLED') {
  if (status) {
    return db.query.todo.findMany({
      where: eq(todo.status, status),
      orderBy: [desc(todo.priority), desc(todo.createdAt)],
      with: { category: true },
    });
  }
  return db.query.todo.findMany({
    orderBy: [desc(todo.priority), desc(todo.createdAt)],
    with: { category: true },
  });
}

export async function getTodoById(id: string) {
  return db.query.todo.findFirst({
    where: eq(todo.id, id),
    with: { category: true },
  });
}

export async function updateTodo(id: string, input: UpdateTodoInput) {
  const existing = await db.query.todo.findFirst({ where: eq(todo.id, id) });
  if (!existing) return null;
  if (existing.status !== 'PENDING') {
    return { error: 'Cannot update a completed or cancelled todo' };
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (input.task !== undefined) updateData.task = input.task;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;
  if (input.estimatedMinutes !== undefined) updateData.estimatedMinutes = input.estimatedMinutes;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.tags !== undefined) updateData.tags = JSON.stringify(input.tags);

  await db.update(todo).set(updateData).where(eq(todo.id, id));
  return db.query.todo.findFirst({ where: eq(todo.id, id), with: { category: true } });
}

export async function completeTodo(id: string, input: CompleteTodoInput) {
  const existing = await db.query.todo.findFirst({ where: eq(todo.id, id) });
  if (!existing) return { error: 'Todo not found' };
  if (existing.status !== 'PENDING') return { error: 'Todo is not pending' };

  const today = format(new Date(), 'yyyy-MM-dd');
  const durationMinutes = input.actualMinutes ?? existing.estimatedMinutes;

  let taskStr = existing.task;
  if (existing.tags) {
    try {
      const tags = JSON.parse(existing.tags) as string[];
      if (tags.length > 0) {
        taskStr = `[${tags.join(', ')}] ${existing.task}`;
      }
    } catch {
      // ignore bad JSON
    }
  }

  const entryResult = await createEntry(today, {
    task: taskStr,
    outcome: input.outcome,
    durationMinutes,
    categoryId: existing.categoryId,
  });

  if (!entryResult.success) {
    return { error: 'Entry quality check failed', issues: entryResult.issues };
  }

  await db.update(todo).set({
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
    logEntryId: entryResult.entry?.id ?? null,
    updatedAt: new Date().toISOString(),
  }).where(eq(todo.id, id));

  const updated = await db.query.todo.findFirst({ where: eq(todo.id, id), with: { category: true } });
  return { success: true, todo: updated, entry: entryResult.entry };
}

export async function cancelTodo(id: string) {
  const existing = await db.query.todo.findFirst({ where: eq(todo.id, id) });
  if (!existing) return null;
  if (existing.status !== 'PENDING') return { error: 'Todo is not pending' };

  await db.update(todo).set({
    status: 'CANCELLED',
    updatedAt: new Date().toISOString(),
  }).where(eq(todo.id, id));

  return db.query.todo.findFirst({ where: eq(todo.id, id), with: { category: true } });
}

export async function deleteTodo(id: string) {
  const existing = await db.query.todo.findFirst({ where: eq(todo.id, id) });
  if (!existing) return false;
  await db.delete(todo).where(eq(todo.id, id));
  return true;
}
