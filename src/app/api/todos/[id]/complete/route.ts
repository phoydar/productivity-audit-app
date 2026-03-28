export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { completeTodo } from '@/lib/services/todo-service';
import { completeTodoSchema } from '@/lib/validators';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = completeTodoSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const result = await completeTodo(id, validation.data);
    if ('error' in result) {
      return NextResponse.json({ error: result.error, issues: 'issues' in result ? result.issues : undefined }, { status: 400 });
    }
    return NextResponse.json({ todo: result.todo, entry: result.entry });
  } catch {
    return NextResponse.json({ error: 'Failed to complete todo' }, { status: 500 });
  }
}
