import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { PAYMENT_METHODS } from '@/app/admin/types/database';
import { formatDateTimeBR, todayBR, startOfMonthBRStr } from '@/app/admin/lib/datetime';
import { sanitizeSearchTerm, findMatchingProfileIds } from '@/app/admin/lib/search';

export const dynamic = 'force-dynamic';

export default async function VendasListPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    voided?: string;
    from?: string;
    to?: string;
  }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  let query = supabase
    .from('sales')
    .select(`
      *,
      author:profiles!sales_author_id_fkey(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  // Por padrao esconde vendas canceladas
  if (params.voided !== '1') {
    query = query.is('voided_at', null);
  }

  // Filtro de data inicial (YYYY-MM-DD) — offset -03:00 explicito, senao o
  // Postgres interpreta a meia-noite no fuso da sessao (UTC), 3h adiantada
  // da meia-noite real de Brasília.
  if (params.from) {
    query = query.gte('created_at', `${params.from}T00:00:00-03:00`);
  }

  // Filtro de data final (YYYY-MM-DD)
  if (params.to) {
    query = query.lte('created_at', `${params.to}T23:59:59-03:00`);
  }

  // Busca no banco — sale_number/customer_name/customer_phone são
  // colunas próprias (dá pra filtrar direto); nome do operador precisa
  // de uma consulta separada em profiles primeiro (join não entra no
  // .or() de uma vez só via PostgREST).
  if (params.q) {
    const q = sanitizeSearchTerm(params.q);
    const authorIds = await findMatchingProfileIds(supabase, q);
    const orParts = [
      `sale_number.ilike.%${q}%`,
      `customer_name.ilike.%${q}%`,
      `customer_phone.ilike.%${q}%`,
    ];
    if (authorIds.length > 0) orParts.push(`author_id.in.(${authorIds.join(',')})`);
    query = query.or(orParts.join(','));
  }

  const { data: sales, error } = await query;
  const filtered = sales ?? [];

  // Totais do periodo filtrado
  const totals = filtered.reduce(
    (acc, s) => {
      acc.count += 1;
      acc.total += Number(s.total) || 0;
      return acc;
    },
    { count: 0, total: 0 },
  );

  // Atalhos de data — calculados no calendário de Brasília, não no fuso
  // do servidor (perto da meia-noite, UTC já é "amanhã" ou "ontem" em
  // relação a Brasília). Server Component, lido uma vez por request —
  // Date.now() aqui é seguro, o linter de pureza só não distingue
  // Server de Client Component.
  const today = todayBR();
  // eslint-disable-next-line react-hooks/purity
  const weekAgo = todayBR(new Date(Date.now() - 7 * 86400000));
  const monthStartStr = startOfMonthBRStr();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b-2 border-zinc-950 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950">Vendas</h1>
          <p className="text-xs font-mono uppercase text-zinc-600">
            {totals.count} resultado{totals.count === 1 ? '' : 's'} ·{' '}
            <strong className="text-zinc-950">
              {totals.total.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </strong>
          </p>
        </div>
        <Link
          href="/admin/vender"
          className="border-2 border-zinc-950 bg-zinc-950 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-zinc-800 transition"
        >
          + Nova venda
        </Link>
      </div>

      {/* Filtros */}
      <form className="space-y-2 border-2 border-zinc-950 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Buscar por número, cliente, operador…"
            aria-label="Buscar por número, cliente, operador"
            className="flex-1 border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
          />
          <button
            type="submit"
            className="border-2 border-zinc-950 bg-zinc-950 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition"
          >
            Buscar
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 font-mono text-xs text-zinc-700">
            <span>De:</span>
            <input
              type="date"
              name="from"
              defaultValue={params.from ?? ''}
              className="border border-zinc-300 bg-white px-2 py-1 font-mono text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            />
          </label>
          <label className="flex items-center gap-1 font-mono text-xs text-zinc-700">
            <span>Até:</span>
            <input
              type="date"
              name="to"
              defaultValue={params.to ?? ''}
              className="border border-zinc-300 bg-white px-2 py-1 font-mono text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
            />
          </label>

          {/* Atalhos */}
          <div className="ml-auto flex flex-wrap items-center gap-1 text-xs">
            <span className="font-mono text-zinc-500">Atalhos:</span>
            <Link
              href={`/admin/vendas?from=${today}&to=${today}`}
              className="border border-zinc-300 bg-zinc-100 px-2 py-1 font-mono text-xs font-bold uppercase text-zinc-800 hover:border-zinc-950 hover:bg-zinc-200 transition"
            >
              Hoje
            </Link>
            <Link
              href={`/admin/vendas?from=${weekAgo}`}
              className="border border-zinc-300 bg-zinc-100 px-2 py-1 font-mono text-xs font-bold uppercase text-zinc-800 hover:border-zinc-950 hover:bg-zinc-200 transition"
            >
              Últimos 7 dias
            </Link>
            <Link
              href={`/admin/vendas?from=${monthStartStr}`}
              className="border border-zinc-300 bg-zinc-100 px-2 py-1 font-mono text-xs font-bold uppercase text-zinc-800 hover:border-zinc-950 hover:bg-zinc-200 transition"
            >
              Este mês
            </Link>
            {(params.from || params.to || params.q) && (
              <Link
                href="/admin/vendas"
                className="border border-red-300 bg-red-50 px-2 py-1 font-mono text-xs font-bold uppercase text-red-700 hover:border-red-600 transition"
              >
                Limpar filtros
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm pt-1 border-t border-zinc-200">
          <Link
            href={
              params.voided === '1'
                ? `/admin/vendas?${new URLSearchParams({ ...params, voided: '' }).toString()}`.replace(/voided=/, '')
                : `/admin/vendas?${new URLSearchParams({ ...params, voided: '1' }).toString()}`
            }
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition ${
              params.voided === '1'
                ? 'border-2 border-red-600 bg-red-600 text-white'
                : 'border border-zinc-300 bg-white text-zinc-700 hover:border-zinc-950 hover:bg-zinc-100'
            }`}
          >
            {params.voided === '1' ? '✓ Canceladas' : 'Mostrar canceladas'}
          </Link>
        </div>
      </form>

      {error && (
        <div className="border-2 border-red-600 bg-red-50 p-3 font-mono text-xs font-bold uppercase text-red-700">
          Erro ao carregar vendas: {error.message}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-300 bg-white p-8 text-center font-mono">
          <p className="text-xs uppercase text-zinc-500">
            {params.q || params.from || params.to
              ? 'Nenhuma venda encontrada com esses filtros.'
              : 'Nenhuma venda registrada ainda.'}
          </p>
          <Link
            href="/admin/vender"
            className="mt-3 inline-block font-mono text-xs font-bold uppercase text-zinc-950 underline hover:text-zinc-700"
          >
            Fazer primeira venda →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-zinc-950 bg-white shadow-sm">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b-2 border-zinc-950 bg-zinc-100 text-xs font-bold uppercase tracking-wider text-zinc-950">
              <tr>
                <th className="px-3 py-2.5">Número</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Data</th>
                <th className="px-3 py-2.5">Cliente</th>
                <th className="px-3 py-2.5">Pagto</th>
                <th className="px-3 py-2.5 text-right">Total</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filtered.map((s) => {
                const payMeta = PAYMENT_METHODS.find((m) => m.value === s.payment_method);
                return (
                  <tr key={s.id} className="hover:bg-zinc-50">
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/vendas/${s.id}`}
                        className="font-bold text-zinc-950 hover:underline"
                      >
                        {s.sale_number}
                      </Link>
                      {s.voided_at && (
                        <span className="ml-2 border border-red-300 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-red-700">
                          Cancelada
                        </span>
                      )}
                    </td>
                    <td className="hidden px-3 py-2 text-zinc-600 sm:table-cell">
                      {formatDateTimeBR(s.created_at)}
                    </td>
                    <td className="px-3 py-2 text-zinc-800">
                      {s.customer_name ?? <span className="text-zinc-400">Balcão</span>}
                    </td>
                    <td className="px-3 py-2 text-zinc-800">{payMeta?.label}</td>
                    <td className="px-3 py-2 text-right font-bold text-zinc-950">
                      {s.total.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="hidden px-3 py-2 text-zinc-600 sm:table-cell">
                      {s.author?.full_name ?? '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
