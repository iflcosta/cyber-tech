import Link from 'next/link';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { startOfMonthBR, formatDateTimeBR } from '@/app/admin/lib/datetime';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tech?: string; status?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await getAuthedProfile();
  if (!user) return null;

  // Busca lista de técnicos com comissão
  const { data: technicians } = await supabase
    .from('profiles')
    .select('id, full_name, role, commission_rate')
    .order('full_name');

  // Query do livro-razão de comissões
  let ledgerQuery = supabase
    .from('commission_ledger')
    .select('*, service_orders(short_id, equipment_brand, equipment_model, status)')
    .order('created_at', { ascending: false });

  if (params.tech) {
    ledgerQuery = ledgerQuery.eq('technician_id', params.tech);
  }

  if (params.status) {
    ledgerQuery = ledgerQuery.eq('status', params.status);
  }

  const { data: ledger, error } = await ledgerQuery;

  const records = ledger ?? [];

  // Totais agregados
  const totalLabor = records.reduce((acc, r) => acc + Number(r.labor_amount || 0), 0);
  const totalCommission = records.reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);
  const totalPending = records
    .filter((r) => r.status === 'pending')
    .reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);
  const totalPaidOut = records
    .filter((r) => r.status === 'paid_out')
    .reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);

  // Totais por técnico
  const iagoTotal = records
    .filter((r) => r.technician_name.toLowerCase().includes('iago') && r.status === 'pending')
    .reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);

  const jeffersonTotal = records
    .filter((r) => r.technician_name.toLowerCase().includes('jefferson') && r.status === 'pending')
    .reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Comissões & Acertos Técnicos
          </h1>
          <p className="text-sm text-slate-500">
            Gestão transparente de comissões sobre mão de obra líquida (Iago 30% · Jefferson 50/50 Mezanino)
          </p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Mão de Obra Total</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-900">{fmtBRL(totalLabor)}</p>
          <p className="text-xs text-slate-400 mt-1">{records.length} OSs com comissão</p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">Total a Pagar (Pendente)</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-900">{fmtBRL(totalPending)}</p>
          <p className="text-xs text-amber-700 mt-1">Aguardando fechamento quinzenal</p>
        </div>

        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Iago (30%)</p>
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-800">Balcão/Hardware</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-blue-900">{fmtBRL(iagoTotal)}</p>
          <p className="text-xs text-blue-600 mt-1">Pendente de acerto</p>
        </div>

        <div className="rounded-lg border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-700">Jefferson (50/50)</p>
            <span className="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-bold text-purple-800">Mezanino/Telas/GPU</span>
          </div>
          <p className="mt-1 text-2xl font-extrabold text-purple-900">{fmtBRL(jeffersonTotal)}</p>
          <p className="text-xs text-purple-600 mt-1">Pendente de acerto</p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm text-sm">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">Filtro:</span>
        <Link
          href="/admin/comissoes"
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            !params.tech && !params.status
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Todos
        </Link>
        <Link
          href="/admin/comissoes?status=pending"
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            params.status === 'pending'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Só Pendentes
        </Link>
        <Link
          href="/admin/comissoes?status=paid_out"
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            params.status === 'paid_out'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Já Acertados
        </Link>

        {(technicians ?? []).map((t) => (
          <Link
            key={t.id}
            href={`/admin/comissoes?tech=${t.id}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
              params.tech === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {t.full_name} ({Math.round(t.commission_rate * 100)}%)
          </Link>
        ))}
      </div>

      {/* Tabela de Lançamentos */}
      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Erro ao carregar comissões: {error.message}
        </div>
      )}

      {records.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <p className="text-base font-medium text-slate-700">Nenhum registro de comissão encontrado.</p>
          <p className="text-sm text-slate-500 mt-1">
            As comissões são geradas automaticamente quando uma OS com técnico atribuído e valor de mão de obra é paga ou concluída.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">OS / Aparelho</th>
                <th className="px-4 py-3">Técnico</th>
                <th className="px-4 py-3">Mão de Obra</th>
                <th className="px-4 py-3">Taxa</th>
                <th className="px-4 py-3">Comissão</th>
                <th className="px-4 py-3">Pagamento OS</th>
                <th className="px-4 py-3">Status Acerto</th>
                <th className="px-4 py-3 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800">
              {records.map((r) => {
                const so = r.service_orders;
                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="px-4 py-3 font-medium text-slate-900">
                      <Link href={`/admin/os/${r.service_order_id}`} className="text-blue-600 hover:underline">
                        {so?.short_id ? `#${so.short_id}` : 'Ver OS'}
                      </Link>
                      <div className="text-xs text-slate-500 font-normal">
                        {so?.equipment_brand} {so?.equipment_model}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {r.technician_name}
                    </td>
                    <td className="px-4 py-3">
                      {fmtBRL(Number(r.labor_amount))}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">
                      {Math.round(Number(r.commission_rate) * 100)}%
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {fmtBRL(Number(r.commission_amount))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.os_payment_status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : r.os_payment_status === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {r.os_payment_status === 'paid' ? 'Pago' : r.os_payment_status === 'partial' ? 'Parcial' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold ${
                          r.status === 'paid_out'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {r.status === 'paid_out' ? '✓ Acerto Feito' : '⏳ Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">
                      {formatDateTimeBR(r.created_at)}
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
