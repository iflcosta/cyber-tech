/**
 * Backup automático diário do banco do ERP.
 *
 * Disparado pelo Vercel Cron (ver vercel.json) uma vez por dia. Não
 * existia nenhuma proteção contra perda de dado — Supabase no plano
 * free não tem point-in-time recovery, então um projeto apagado por
 * engano ou corrompido não tinha de onde voltar.
 *
 * O que faz:
 *   1. Lê TODAS as linhas de todas as tabelas relevantes (via
 *      service_role — ignora RLS de propósito, isso não é uma
 *      requisição de usuário, é rotina de sistema).
 *   2. Salva tudo num JSON único, com timestamp, no bucket privado
 *      db-backups do Storage.
 *   3. Apaga backups com mais de RETENTION_DAYS pra não crescer sem
 *      limite (o plano free do Supabase tem storage limitado).
 *
 * Restaurar: baixar o JSON do backup desejado no painel do Supabase
 * (Storage → db-backups) e reinserir tabela por tabela — os dados vêm
 * na ordem certa de dependência (profiles/customers/suppliers antes
 * do que referencia eles).
 */

import { NextResponse } from 'next/server';
import { createCRMServiceClient } from '@/app/admin/lib/supabase/service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const RETENTION_DAYS = 30;
const BUCKET = 'db-backups';

// Ordem importa pra facilitar restauração manual depois (tabelas
// referenciadas primeiro, quem referencia depois).
const TABLES = [
  'profiles',
  'customers',
  'suppliers',
  'service_orders',
  'service_order_events',
  'stock_category_codes',
  'stock_items',
  'stock_movements',
  'sales',
  'sale_items',
  'part_orders',
  'part_order_events',
  'contact_leads',
] as const;

function checkAuth(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // sem secret configurado = nunca autoriza
  const header = req.headers.get('authorization');
  return header === `Bearer ${secret}`;
}

async function ensureBucket(supabase: ReturnType<typeof createCRMServiceClient>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === BUCKET)) return;
  const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
  // Corrida entre execuções concorrentes criando ao mesmo tempo — ignora "already exists".
  if (error && !error.message.includes('already exists')) throw error;
}

async function runBackup() {
  const supabase = createCRMServiceClient();
  await ensureBucket(supabase);

  const dump: Record<string, unknown[]> = {};
  const counts: Record<string, number> = {};

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select('*');
    if (error) {
      // Uma tabela falhando não deve derrubar o backup inteiro das outras —
      // registra o erro dentro do próprio dump e segue.
      dump[table] = [];
      counts[table] = -1;
      dump[`${table}__error`] = [{ message: error.message }] as unknown[];
      continue;
    }
    dump[table] = data ?? [];
    counts[table] = data?.length ?? 0;
  }

  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const path = `backup-${dateStr}-${now.getTime()}.json`;

  const payload = JSON.stringify({ createdAt: now.toISOString(), counts, tables: dump });

  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(path, payload, { contentType: 'application/json', upsert: false });
  if (upErr) throw new Error(`Falha ao subir backup: ${upErr.message}`);

  // Retenção: apaga backups mais antigos que RETENTION_DAYS.
  const { data: existing } = await supabase.storage.from(BUCKET).list('', { limit: 1000 });
  const cutoff = now.getTime() - RETENTION_DAYS * 86400000;
  const toDelete = (existing ?? [])
    .filter((f) => f.name.startsWith('backup-'))
    .filter((f) => {
      const createdAt = f.created_at ? new Date(f.created_at).getTime() : NaN;
      return Number.isFinite(createdAt) && createdAt < cutoff;
    })
    .map((f) => f.name);

  if (toDelete.length > 0) {
    await supabase.storage.from(BUCKET).remove(toDelete);
  }

  return { path, counts, deletedOld: toDelete.length, sizeBytes: payload.length };
}

export async function GET(req: Request) {
  if (!checkAuth(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  try {
    const result = await runBackup();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error('[backup] falhou:', e);
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 },
    );
  }
}
