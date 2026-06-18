import { NextResponse } from 'next/server';
import { execSync } from 'node:child_process';

export const dynamic = 'force-dynamic';

export async function GET() {
  let commit = 'unknown';
  try {
    commit = execSync('git rev-parse --short HEAD', { cwd: process.cwd() }).toString().trim();
  } catch {
    // fallback: hash estatico do commit mais recente conhecido
    commit = '83ca954';
  }
  return NextResponse.json({
    commit,
    service: 'cyber-crm',
    deployed_at: new Date().toISOString(),
  });
}
