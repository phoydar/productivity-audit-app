export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getLogByDate, getOrCreateLog, updateLog } from '@/lib/services/log-service';
import { dateParamSchema, updateLogSchema } from '@/lib/validators';

export async function GET(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { date } = await params;
    const validation = dateParamSchema.safeParse(date);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const log = await getLogByDate(date);
    if (!log) {
      // Return empty shell instead of 404 — no log yet is a normal state
      return NextResponse.json({
        log: {
          id: null,
          logDate: date,
          summary: null,
          observations: null,
          isReconstructed: false,
          generatedAt: null,
          entries: [],
          breakdown: [],
        },
      });
    }
    return NextResponse.json({ log });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch log' }, { status: 500 });
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
    const log = await getOrCreateLog(date);
    return NextResponse.json({ log }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const { date } = await params;
    const dateValidation = dateParamSchema.safeParse(date);
    if (!dateValidation.success) {
      return NextResponse.json({ error: dateValidation.error.issues }, { status: 400 });
    }
    const body = await request.json();
    const validation = updateLogSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const log = await updateLog(date, validation.data);
    return NextResponse.json({ log });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }
}
