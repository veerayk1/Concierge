/**
 * Temporary endpoint to regenerate Prisma client from the running Next.js process.
 * This runs on the user's Mac where the correct darwin-arm64 engine exists.
 * DELETE THIS FILE after use.
 */

import { NextRequest, NextResponse } from 'next/server';
import { execSync } from 'child_process';
import path from 'path';

export async function POST(request: NextRequest) {
  const demoRole = request.headers.get('x-demo-role');
  if (demoRole !== 'super_admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    // Find the project root (where package.json is)
    const projectRoot = path.resolve(process.cwd());

    // Run prisma generate
    const output = execSync('npx prisma generate', {
      cwd: projectRoot,
      encoding: 'utf-8',
      timeout: 60000,
      env: { ...process.env, PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1' },
    });

    return NextResponse.json({
      success: true,
      projectRoot,
      output: output.substring(0, 2000),
      message: 'Prisma client regenerated. Restart the dev server for changes to take effect.',
    });
  } catch (error: unknown) {
    const err = error as { stdout?: string; stderr?: string; message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err.message || String(error),
        stdout: err.stdout?.substring(0, 1000),
        stderr: err.stderr?.substring(0, 1000),
      },
      { status: 500 },
    );
  }
}
