export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { updateEntry, deleteEntry } from '@/lib/services/entry-service';
import { updateEntrySchema } from '@/lib/validators';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const body = await request.json();
    const validation = updateEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const result = await updateEntry(id, validation.data);
    if (!result) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    if (!result.success) {
      return NextResponse.json({ error: 'Quality check failed', issues: result.issues }, { status: 422 });
    }
    return NextResponse.json({ entry: result.entry });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = await checkAuth(request);
  if (authError) return authError;
  try {
    const { id } = await params;
    const deleted = await deleteEntry(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
