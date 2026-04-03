export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { respondToCheckin } from '@/lib/services/checkin-service';
import { checkinRespondSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  const authError = await checkAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const validation = checkinRespondSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const result = await respondToCheckin(validation.data.step, validation.data.response);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to process response';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
