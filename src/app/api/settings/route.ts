export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { settingsSchema } from '@/lib/validators';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const rows = await db.query.settings.findMany();
    const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }
    return NextResponse.json({ settings: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const validation = settingsSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues }, { status: 400 });
    }
    for (const [key, value] of Object.entries(validation.data)) {
      if (value !== undefined) {
        const existing = await db.query.settings.findFirst({ where: eq(settings.key, key) });
        if (existing) {
          await db.update(settings).set({ value: JSON.stringify(value) }).where(eq(settings.key, key));
        } else {
          await db.insert(settings).values({ key, value: JSON.stringify(value) });
        }
      }
    }
    // Return updated settings
    const rows = await db.query.settings.findMany();
    const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.value);
      } catch {
        result[row.key] = row.value;
      }
    }
    return NextResponse.json({ settings: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
