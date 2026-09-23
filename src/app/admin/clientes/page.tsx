import Link from 'next/link';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { sanitizeSearchTerm, customerSearchOr } from '@/app/admin/lib/search';

export const dynamic = 'force-dynamic';

export default async function ClientesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await getAuthedUser();
  if (!user) return null;

  let query = supabase
    .from('customers')
    .select('id, name, phone, email, created_at')
    .order('name');

  if (params.q) {
    const q = sanitizeSearchTerm(params.q);
    query = query.or(customerSearchOr(q, [`email.ilike.%${q}%`]));
  }

  const { data: customers, error } = await query;

  // Contagem de OS e vendas por cliente — duas queries agregadas em vez
  // de N+1 (uma por cliente). Volume ainda pequeno, então tudo cabe
  // numa consulta só sem paginação.
  const ids = (customers ?? []).map((c) => c.id);
  const [{ data: osRows }, { data: saleRows }] = await Promise.all([
    ids.length > 0
      ? supabase.from('service_orders').select('customer_id').in('customer_id', ids)
      : Promise.resolve({ data: [] as { customer_id: string }[] }),
    ids.length > 0
      ? supabase.from('sales').select('customer_id').in('customer_id', ids).is('voided_at', null)
      : Promise.resolve({ data: [] as { customer_id: string | null }[] }),
  ]);

  const osCounts = new Map<string, number>();
  for (const r of osRows ?? []) osCounts.set(r.customer_id, (osCounts.get(r.customer_id) ?? 0) + 1);
  const saleCounts = new Map<string, number>();
  for (const r of saleRows ?? []) {
    if (!r.customer_id) continue;
    saleCounts.set(r.customer_id, (saleCounts.get(r.customer_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Clientes</h1>
        <p className="text-sm text-slate-500">
          {(customers ?? []).length} resultado{(customers ?? []).length === 1 ? '' : 's'}
        </p>
      </div>

      <form className="rounded-lg border border-slate-200 bg-white p-3" method="get">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Buscar por nome, telefone ou e-mail…"
          aria-label="Buscar cliente por nome, telefone ou e-mail"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
        />
      </form>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Erro ao carregar clientes: {error.message}
        </div>
      )}

      {(customers ?? []).length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Nenhum cliente encontrado.</p>
          <p className="mt-1 text-xs text-slate-400">
            Clientes são criados automaticamente ao abrir uma OS ou vincular uma venda.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {(customers ?? []).map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/clientes/${c.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{c.name}</p>
                  <p className="text-sm text-slate-500">
                    {c.phone ?? '—'}
                    {c.email && ` · ${c.email}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  {(osCounts.get(c.id) ?? 0) > 0 && (
                    <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-medium text-zinc-900">
                      {osCounts.get(c.id)} OS
                    </span>
                  )}
                  {(saleCounts.get(c.id) ?? 0) > 0 && (
                    <span className="rounded bg-zinc-100 border border-zinc-300 px-1.5 py-0.5 font-medium text-zinc-800">
                      {saleCounts.get(c.id)} compra{saleCounts.get(c.id) === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
