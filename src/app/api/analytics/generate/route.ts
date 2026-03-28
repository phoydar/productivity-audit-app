export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { generateInsights } from '@/lib/services/insight-service';
import { dateRangeSchema } from '@/lib/validators';

export async function POST(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const validation = dateRangeSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    const { from, to } = validation.data;
    if (!from || !to) {
      return NextResponse.json({ error: 'Both from and to dates are required' }, { status: 400 });
    }
    const result = await generateInsights(from, to);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate insights' }, { status: 500 });
  }
}
