import Link from 'next/link';
import { redirect } from 'next/navigation';
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
  if (!user) redirect('/admin/login');

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

  // Server Component: "agora" é lido uma vez por request — Date.now()
  // aqui é seguro, o linter de pureza só não distingue Server de Client.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const filtered = ((orders ?? []) as unknown as PartOrderRow[]).map((o) => ({
    ...o,
    supplier_name: o.supplier?.name ?? '(fornecedor removido)',
    os_label: o.service_order?.short_id ?? o.service_order?.os_number ?? null,
    customer_name: o.service_order?.customer?.name ?? null,
    days_since_update: Math.max(
      0,
      Math.floor((now - new Date(o.updated_at).getTime()) / 86400000),
    ),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-2xl font-black uppercase tracking-tight text-zinc-950">Pedidos de Peça</h1>
          <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
            {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
            {params.status && params.status !== 'all' && (
              ` (filtrado por ${PART_ORDER_STATUSES.find((s) => s.value === params.status)?.label ?? params.status})`
            )}
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-2">
          <Link
            href="/admin/fornecedores"
            className="border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
          >
            Fornecedores
          </Link>
          <Link
            href="/admin/pecas/new"
            className="border-2 border-zinc-950 bg-zinc-950 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition lg:hidden"
          >
            + Novo pedido
          </Link>
        </div>
      </div>

      <PartOrderFilter />

      {error && (
        <div className="border border-red-500 bg-red-50 p-3 font-mono text-xs text-red-700">
          Erro ao carregar pedidos: {error.message}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="font-mono text-xs text-zinc-500">Nenhum pedido de peça encontrado com esses filtros.</p>
          <Link
            href="/admin/pecas/new"
            className="mt-3 inline-block font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 underline hover:text-zinc-700"
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
              className="block border-2 border-zinc-950 bg-white p-4 transition hover:bg-zinc-50"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-bold text-zinc-950">
                    {o.part_description}
                    {o.part_variant && <span className="text-zinc-500 font-normal"> · {o.part_variant}</span>}
                  </p>
                  <p className="font-mono text-xs text-zinc-500">{o.supplier_name}</p>
                </div>
                <PartOrderStatusBadge status={o.status} />
              </div>
              <div className="mt-3 flex items-center justify-between font-mono text-xs">
                <span className="text-zinc-600">
                  {o.os_label ? (
                    <>OS {o.os_label}{o.customer_name ? ` · ${o.customer_name}` : ''}</>
                  ) : o.context_note ? (
                    o.context_note
                  ) : (
                    <span className="text-zinc-400">Sem OS vinculada</span>
                  )}
                </span>
                <span className="font-mono font-black text-zinc-950">
                  {Number(o.part_value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              {o.status === 'return_pending' && o.days_since_update >= PART_ORDER_STALE_DAYS && (
                <p className="mt-2 border border-red-300 bg-red-50 px-2 py-1 font-mono text-xs font-bold text-red-700">
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
