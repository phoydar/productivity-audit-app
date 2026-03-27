import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { createTodo, getTodos } from '@/lib/services/todo-service';
import { createTodoSchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const status = request.nextUrl.searchParams.get('status') as 'PENDING' | 'COMPLETED' | 'CANCELLED' | null;
    const todos = await getTodos(status ?? undefined);
    return NextResponse.json({ todos });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch todos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const validation = createTodoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const todo = await createTodo(validation.data);
    return NextResponse.json({ todo }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create todo' }, { status: 500 });
  }
}
