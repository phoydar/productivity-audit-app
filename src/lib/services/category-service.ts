import { db } from '@/lib/db';
import { category } from '@/lib/db/schema';
import { eq, asc, or, isNull } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import type { Category } from '@/types';

export async function getCategories(userId?: string): Promise<Category[]> {
  // Return system categories (user_id IS NULL) and user's own categories
  return db.query.category.findMany({
    where: userId
      ? or(isNull(category.userId), eq(category.userId, userId))
      : isNull(category.userId),
    orderBy: [asc(category.sortOrder), asc(category.name)],
  });
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return (await db.query.category.findFirst({ where: eq(category.id, id) })) ?? null;
}

export async function createCategory(input: {
  name: string;
  color?: string;
  icon?: string;
  isFocusType?: boolean;
  sortOrder?: number;
  userId?: string;
}): Promise<Category> {
  const id = createId();
  await db.insert(category).values({
    id,
    userId: input.userId ?? null,
    name: input.name,
    color: input.color ?? '#6366f1',
    icon: input.icon ?? null,
    isFocusType: input.isFocusType ?? false,
    sortOrder: input.sortOrder ?? 0,
  });
  return db.query.category.findFirst({ where: eq(category.id, id) }) as Promise<Category>;
}

export async function updateCategory(id: string, input: {
  name?: string;
  color?: string;
  icon?: string;
  isFocusType?: boolean;
  sortOrder?: number;
}): Promise<Category | null> {
  const existing = await db.query.category.findFirst({ where: eq(category.id, id) });
  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.color !== undefined) updateData.color = input.color;
  if (input.icon !== undefined) updateData.icon = input.icon;
  if (input.isFocusType !== undefined) updateData.isFocusType = input.isFocusType;
  if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder;

  await db.update(category).set(updateData).where(eq(category.id, id));
  return db.query.category.findFirst({ where: eq(category.id, id) }) as Promise<Category>;
}

export async function deleteCategory(id: string): Promise<boolean> {
  // Prevent deleting system categories
  const existing = await db.query.category.findFirst({ where: eq(category.id, id) });
  if (!existing) return false;
  if (existing.userId === null) return false; // system categories are protected

  await db.delete(category).where(eq(category.id, id));
  return true;
}
