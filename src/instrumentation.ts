export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    const { db } = await import('@/lib/db');
    const path = await import('path');
    const migrationsFolder = path.join(process.cwd(), 'src/lib/db/migrations');
    await migrate(db, { migrationsFolder });
    console.log('[db] migrations applied');
  }
}
