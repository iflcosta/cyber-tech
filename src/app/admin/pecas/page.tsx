import Link from 'next/link';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PartOrderStatusBadge } from '@/app/admin/components/PartOrderStatusBadge';
import { PartOrderFilter } from './PartOrderFilter';
import { PART_ORDER_STALE_DAYS, PART_ORDER_STATUSES, type PartOrder } from '@/app/admin/types/database';
import {
  sanitizeSearchTerm,
  findMatchingCustomerIds,
  findMatchingServiceOrderIds,
  findMatchingSupplierIds,
} from '@/app/admin/lib/search';

export const dynamic = 'force-dynamic';

type PartOrderRow = PartOrder & {
  supplier: { name: string } | null;
  service_order: {
    short_id: string | null;
    os_number: string | null;
    customer: { name: string } | null;
  } | null;
};

export default async function PartOrdersListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await getAuthedUser();
  if (!user) return null;

  let query = supabase
    .from('part_orders')
    .select(`
      *,
      supplier:suppliers(name),
      service_order:service_orders(short_id, os_number, customer:customers(name))
    `)
    .order('updated_at', { ascending: false })
    .limit(100);

  // "Todos" precisa mostrar TUDO, inclusive Devolvido/Cancelado — antes
  // filtrava escondido por um subconjunto de status "ativos", então um
  // pedido já devolvido sumia da visão "Todos" e só aparecia filtrando
  // "Devolvido" na mão, dando a impressão de que o registro tinha sumido.
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  // Busca no banco — part_description/part_variant/context_note são
  // colunas próprias; fornecedor e OS/cliente vêm de join, então
  // resolvidos antes via IDs (mesmo padrão da lista de OS).
  if (params.q) {
    const q = sanitizeSearchTerm(params.q);
    const [supplierIds, customerIds] = await Promise.all([
      findMatchingSupplierIds(supabase, q),
      findMatchingCustomerIds(supabase, q),
    ]);
    const serviceOrderIds = await findMatchingServiceOrderIds(supabase, q, customerIds);
    const orParts = [
      `part_description.ilike.%${q}%`,
      `part_variant.ilike.%${q}%`,
      `context_note.ilike.%${q}%`,
    ];
    if (supplierIds.length > 0) orParts.push(`supplier_id.in.(${supplierIds.join(',')})`);
    if (serviceOrderIds.length > 0) orParts.push(`service_order_id.in.(${serviceOrderIds.join(',')})`);
    query = query.or(orParts.join(','));
  }

  const { data: orders, error } = await query;

  const filtered = ((orders ?? []) as unknown as PartOrderRow[]).map((o) => ({
    ...o,
    supplier_name: o.supplier?.name ?? '(fornecedor removido)',
    os_label: o.service_order?.short_id ?? o.service_order?.os_number ?? null,
    customer_name: o.service_order?.customer?.name ?? null,
    days_since_update: Math.max(
      0,
      Math.floor((Date.now() - new Date(o.updated_at).getTime()) / 86400000),
    ),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pedidos de Peça</h1>
          <p className="text-sm text-slate-500">
            {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            {params.status && params.status !== 'all' && (
              ` (filtrado por ${PART_ORDER_STATUSES.find((s) => s.value === params.status)?.label ?? params.status})`
            )}
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Link
            href="/admin/fornecedores"
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fornecedores
          </Link>
          <Link
            href="/admin/pecas/new"
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 lg:hidden"
          >
            + Novo pedido
          </Link>
        </div>
      </div>

      <PartOrderFilter />

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Erro ao carregar pedidos: {error.message}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Nenhum pedido de peça encontrado com esses filtros.</p>
          <Link
            href="/admin/pecas/new"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Registrar o primeiro →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((o) => (
            <Link
              key={o.id}
              href={`/admin/pecas/${o.id}`}
              className="block rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">
                    {o.part_description}
                    {o.part_variant && <span className="text-slate-500"> · {o.part_variant}</span>}
                  </p>
                  <p className="text-sm text-slate-500">{o.supplier_name}</p>
                </div>
                <PartOrderStatusBadge status={o.status} />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {o.os_label ? (
                    <>OS {o.os_label}{o.customer_name ? ` · ${o.customer_name}` : ''}</>
                  ) : o.context_note ? (
                    o.context_note
                  ) : (
                    <span className="text-slate-500">Sem OS vinculada</span>
                  )}
                </span>
                <span className="font-mono font-medium text-slate-900">
                  {Number(o.part_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              {o.status === 'return_pending' && o.days_since_update >= PART_ORDER_STALE_DAYS && (
                <p className="mt-2 rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                  ⚠️ Sinalizada há {o.days_since_update} dias sem confirmar devolução
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
