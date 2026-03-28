export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getWeeklyBreakdown } from '@/lib/services/analytics-service';

export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const breakdown = await getWeeklyBreakdown();
    return NextResponse.json({ breakdown });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch weekly breakdown' }, { status: 500 });
  }
}
