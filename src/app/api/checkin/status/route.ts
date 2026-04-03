export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getCheckinStatus } from '@/lib/services/checkin-service';

export async function GET(request: NextRequest) {
  const authError = await checkAuth(request);
  if (authError) return authError;
  try {
    const status = getCheckinStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get check-in status' }, { status: 500 });
  }
}
