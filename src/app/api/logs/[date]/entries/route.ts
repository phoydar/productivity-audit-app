export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getEntriesForDate, createEntry } from '@/lib/services/entry-service';
import { dateParamSchema, createEntrySchema } from '@/lib/validators';

const RETROACTIVE_LIMIT_DAYS = 30;

export async function GET(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { date } = await params;
    const validation = dateParamSchema.safeParse(date);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const entries = await getEntriesForDate(date);
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { date } = await params;
    const dateValidation = dateParamSchema.safeParse(date);
    if (!dateValidation.success) {
      return NextResponse.json({ error: dateValidation.error.issues }, { status: 400 });
    }
    // Enforce 30-day retroactive window
    const targetDate = new Date(date + 'T00:00:00');
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const earliest = new Date(todayStart);
    earliest.setDate(earliest.getDate() - RETROACTIVE_LIMIT_DAYS);

    if (targetDate < earliest) {
      return NextResponse.json(
        { error: `Cannot log entries more than ${RETROACTIVE_LIMIT_DAYS} days in the past` },
        { status: 400 }
      );
    }
    if (targetDate > todayStart) {
      return NextResponse.json(
        { error: 'Cannot log entries for future dates' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = createEntrySchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const result = await createEntry(date, validation.data);
    if (!result.success) {
      return NextResponse.json({ error: 'Quality check failed', issues: result.issues }, { status: 422 });
    }
    return NextResponse.json({ entry: result.entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
