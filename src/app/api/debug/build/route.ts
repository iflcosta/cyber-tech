import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Tenta ler o source do componente direto do filesystem do build
  // Se o Vercel buildou, o .next/ tem o codigo compilado. Se nao,
  // o arquivo fonte nao esta no deploy.
  const componentPath = join(process.cwd(), '.next/server/app/admin/crm/os/[id]/page.js');
  const sourcePath = join(process.cwd(), 'src/app/admin/crm/os/[id]/StatusQuickActions.tsx');
  const pageSource = join(process.cwd(), 'src/app/admin/crm/os/[id]/page.tsx');

  return NextResponse.json({
    env: process.env.VERCEL_ENV ?? 'development',
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'unknown',
    message: process.env.VERCEL_GIT_COMMIT_MESSAGE?.split('\n')[0] ?? '',
    cwd: process.cwd(),
    has_status_quick_source: existsSync(sourcePath),
    has_page_source: existsSync(pageSource),
    has_compiled_page: existsSync(componentPath),
    source_size: existsSync(sourcePath) ? readFileSync(sourcePath, 'utf-8').length : 0,
    page_contains_import: existsSync(pageSource)
      ? readFileSync(pageSource, 'utf-8').includes('StatusQuickActions')
      : false,
    node_env: process.env.NODE_ENV,
    deployed_at: new Date().toISOString(),
  });
}
