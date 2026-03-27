import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates API requests. Same-origin requests (browser dashboard) pass through.
 * External requests (Cowork plugin) must include x-api-secret header.
 * Returns a NextResponse error if unauthorized, or null if authorized.
 */
export function checkAuth(request: NextRequest): NextResponse | null {
  // Allow same-origin requests (browser dashboard)
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (origin && host) {
    try {
      if (new URL(origin).host === host) return null;
    } catch {
      // invalid origin, fall through to secret check
    }
  }

  // Check referer for same-origin navigation
  const referer = request.headers.get('referer');
  if (referer && host) {
    try {
      if (new URL(referer).host === host) return null;
    } catch {
      // invalid referer, fall through
    }
  }

  // External requests need API secret
  const secret = request.headers.get('x-api-secret');
  if (secret !== process.env.API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}
