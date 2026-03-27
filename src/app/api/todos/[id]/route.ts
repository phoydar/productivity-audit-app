import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getTodoById, updateTodo, deleteTodo, cancelTodo } from '@/lib/services/todo-service';
import { updateTodoSchema } from '@/lib/validators';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const todo = await getTodoById(id);
    if (!todo) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ todo });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch todo' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateTodoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const result = await updateTodo(id, validation.data);
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ todo: result });
  } catch {
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;

    // Check for ?cancel=true to cancel instead of hard delete
    const cancel = request.nextUrl.searchParams.get('cancel');
    if (cancel === 'true') {
      const result = await cancelTodo(id);
      if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ todo: result });
    }

    const deleted = await deleteTodo(id);
    if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete todo' }, { status: 500 });
  }
}
