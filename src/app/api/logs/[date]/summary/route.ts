import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getSummary, generateSummary } from '@/lib/services/summary-service';
import { dateParamSchema } from '@/lib/validators';

export async function GET(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { date } = await params;
    const validation = dateParamSchema.safeParse(date);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const summary = await getSummary(date);
    if (!summary) {
      return NextResponse.json({ error: 'No summary found for this date' }, { status: 404 });
    }
    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { date } = await params;
    const validation = dateParamSchema.safeParse(date);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const result = await generateSummary(date);
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
