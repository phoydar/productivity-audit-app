import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { startCheckin } from '@/lib/services/checkin-service';
import { checkinStartSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => ({}));
    const validation = checkinStartSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const { date, mode } = validation.data;
    const result = startCheckin(date, mode);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to start check-in' }, { status: 500 });
  }
}
