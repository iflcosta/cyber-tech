import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedProfile, isIagoUser } from '@/app/admin/lib/auth';
import { sanitizeSearchTerm, customerSearchOr } from '@/app/admin/lib/search';

export const dynamic = 'force-dynamic';

export default async function ClientesListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) redirect('/admin/login');
  const showLeadsButton = isIagoUser(user, profile);

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
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-950 pb-4">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-950">Clientes</h1>
          <p className="text-xs font-mono uppercase text-zinc-600">
            {(customers ?? []).length} resultado{(customers ?? []).length === 1 ? '' : 's'}
          </p>
        </div>
        {showLeadsButton && (
          <Link
            href="/admin/clientes/leads"
            className="border-2 border-zinc-950 bg-zinc-950 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-zinc-800 transition"
          >
            📲 Central de Leads & WhatsApp (Suporte TI)
          </Link>
        )}
      </div>

      <form className="border-2 border-zinc-950 bg-white p-3 shadow-sm" method="get">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Buscar por nome, telefone ou e-mail…"
          aria-label="Buscar cliente por nome, telefone ou e-mail"
          className="w-full border border-zinc-300 bg-white px-3 py-2 text-sm font-mono text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-950/10"
        />
      </form>

      {error && (
        <div className="border-2 border-red-600 bg-red-50 p-3 font-mono text-xs font-bold uppercase text-red-700">
          Erro ao carregar clientes: {error.message}
        </div>
      )}

      {(customers ?? []).length === 0 ? (
        <div className="border-2 border-dashed border-zinc-300 bg-white p-8 text-center font-mono">
          <p className="text-xs uppercase text-zinc-500">Nenhum cliente encontrado.</p>
          <p className="mt-1 text-xs text-zinc-400">
            Clientes são criados automaticamente ao abrir uma OS ou vincular uma venda.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 border-2 border-zinc-950 bg-white shadow-sm font-mono">
          {(customers ?? []).map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/clientes/${c.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-zinc-50 transition"
              >
                <div>
                  <p className="font-bold text-zinc-950">{c.name}</p>
                  <p className="text-xs text-zinc-500">
                    {c.phone ?? '—'}
                    {c.email && ` · ${c.email}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {(osCounts.get(c.id) ?? 0) > 0 && (
                    <span className="border border-zinc-950 bg-zinc-950 px-1.5 py-0.5 text-[11px] font-bold text-white">
                      {osCounts.get(c.id)} OS
                    </span>
                  )}
                  {(saleCounts.get(c.id) ?? 0) > 0 && (
                    <span className="border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-[11px] font-bold text-zinc-900">
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
