import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // VERCEL_GIT_COMMIT_SHA e o hash completo; VERCEL_GIT_COMMIT_MESSAGE o titulo.
  // Sao injetadas pelo Vercel em producao. Se faltarem, e' dev local.
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev-local';
  const msg = process.env.VERCEL_GIT_COMMIT_MESSAGE ?? 'n/a';
  const env = process.env.VERCEL_ENV ?? 'development';
  return NextResponse.json({
    commit: sha,
    message: msg,
    env,
    service: 'cyber-crm',
    deployed_at: new Date().toISOString(),
  });
}
