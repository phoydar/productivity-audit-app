export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { db } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { settingsSchema } from '@/lib/validators';
import { DEFAULT_SETTINGS } from '@/lib/constants';

async function fetchSettings() {
  const rows = await db.select().from(settings);
  const result: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }
  return result;
}

export async function GET(request: NextRequest) {
  const authError = checkAuth(request);
  if (authError) return authError;
  try {
    return NextResponse.json({ settings: await fetchSettings() });
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
        const [existing] = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
        if (existing) {
          await db.update(settings).set({ value: JSON.stringify(value) }).where(eq(settings.key, key));
        } else {
          await db.insert(settings).values({ key, value: JSON.stringify(value) });
        }
      }
    }
    return NextResponse.json({ settings: await fetchSettings() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
