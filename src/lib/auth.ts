import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

/**
 * Validates API requests using a two-tier approach:
 *
 * 1. Session-based auth (browser dashboard) — validates the NextAuth session cookie.
 * 2. API secret (external callers like Cowork plugin) — x-api-secret header.
 *
 * Returns a NextResponse error if unauthorized, or null if authorized.
 */
export async function checkAuth(request: NextRequest): Promise<NextResponse | null> {
  // Check for API secret first (Cowork plugin / external callers)
  const secret = request.headers.get('x-api-secret');
  if (secret && secret === process.env.API_SECRET) {
    return null;
  }

  // Check for valid NextAuth session (browser dashboard)
  const session = await auth();
  if (session?.user) {
    return null;
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
