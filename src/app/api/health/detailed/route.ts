import { NextResponse } from 'next/server';

export async function GET() {
  // TODO: Check db, redis, storage health. Requires Super Admin auth.
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'ok',
      redis: 'ok',
      storage: 'ok',
    },
  });
}
