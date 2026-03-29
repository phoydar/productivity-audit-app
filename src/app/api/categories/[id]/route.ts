export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { updateCategory, deleteCategory } from '@/lib/services/category-service';
import { updateCategorySchema } from '@/lib/validators';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateCategorySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const category = await updateCategory(id, validation.data);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ category });
  } catch {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const deleted = await deleteCategory(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Category not found or system category cannot be deleted' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
