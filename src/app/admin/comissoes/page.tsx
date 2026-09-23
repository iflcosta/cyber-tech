import Link from 'next/link';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { formatDateTimeBR, formatDateBR } from '@/app/admin/lib/datetime';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tech?: string;
    status?: string;
    quinzena?: string; // '1' (dias 1-15), '2' (dias 16-fim), ou 'all'
    mes?: string;      // 'YYYY-MM'
  }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await getAuthedProfile();
  if (!user) return null;

  // Determinar período (mês e quinzena)
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = params.mes || currentMonthStr;
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10); // 1-12

  const selectedQuinzena = params.quinzena || 'all';

  // Calcular datas limites do filtro
  let startDate: Date;
  let endDate: Date;

  if (selectedQuinzena === '1') {
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    endDate = new Date(year, month - 1, 15, 23, 59, 59, 999);
  } else if (selectedQuinzena === '2') {
    startDate = new Date(year, month - 1, 16, 0, 0, 0, 0);
    endDate = new Date(year, month, 0, 23, 59, 59, 999); // último dia do mês
  } else {
    // Mês inteiro
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
  }

  // 1. Busca técnicos cadastrados
  const { data: technicians } = await supabase
    .from('profiles')
    .select('id, full_name, role, commission_rate')
    .order('full_name');

  const techList = technicians ?? [];

  // Mapeia regras por técnico:
  // Iago: 30%
  // Jefferson: 50%
  // Felipe / Loja: 0%
  const getCommissionRate = (techName: string, rateFromDb?: number): number => {
    const nameLower = (techName || '').toLowerCase();
    if (nameLower.includes('iago')) return 0.30;
    if (nameLower.includes('jefferson')) return 0.50;
    if (nameLower.includes('felipe')) return 0.00;
    if (rateFromDb !== undefined && rateFromDb !== null) return Number(rateFromDb);
    return 0.00;
  };

  // 2. Busca lançamentos no commission_ledger
  let ledgerQuery = supabase
    .from('commission_ledger')
    .select('*, service_orders(id, short_id, os_number, equipment_brand, equipment_model, status, payment_status, labor_cost, created_at)')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (params.tech) {
    ledgerQuery = ledgerQuery.eq('technician_id', params.tech);
  }
  if (params.status) {
    ledgerQuery = ledgerQuery.eq('status', params.status);
  }

  const { data: ledgerData, error: ledgerError } = await ledgerQuery;

  // 3. Busca OSs do período para consolidar mão de obra vs peças e garantir nenhuma OS com técnico fique de fora
  let soQuery = supabase
    .from('service_orders')
    .select(`
      id, os_number, short_id, labor_cost, status, payment_status, technician_id, created_at,
      technician:profiles(id, full_name, commission_rate)
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (params.tech) {
    soQuery = soQuery.eq('technician_id', params.tech);
  }

  const { data: serviceOrdersData } = await soQuery;
  const serviceOrders = serviceOrdersData ?? [];

  // 4. Busca peças usadas nas OSs do período (stock_movements)
  const soIds = serviceOrders.map((so) => so.id);
  let partsUsedTotal = 0;

  if (soIds.length > 0) {
    const { data: movements } = await supabase
      .from('stock_movements')
      .select('total_amount, service_order_id, movement_type')
      .in('movement_type', ['out', 'sale'])
      .in('service_order_id', soIds);

    partsUsedTotal = (movements ?? []).reduce(
      (acc, m) => acc + Number(m.total_amount ?? 0),
      0
    );
  }

  // 5. Normaliza e une os registros de comissão
  type CommissionRecord = {
    id: string;
    service_order_id: string;
    os_short_id: string;
    os_number?: string;
    equipment_desc?: string;
    technician_id: string;
    technician_name: string;
    labor_amount: number;
    commission_rate: number;
    commission_amount: number;
    os_payment_status: string;
    status: 'pending' | 'paid_out';
    created_at: string;
  };

  const recordsMap = new Map<string, CommissionRecord>();

  // A partir do commission_ledger
  (ledgerData ?? []).forEach((r) => {
    const key = `${r.service_order_id}-${r.technician_id}`;
    const so = r.service_orders;
    const rate = getCommissionRate(r.technician_name, r.commission_rate);
    const labor = Number(r.labor_amount || 0);
    const comm = Math.round(labor * rate * 100) / 100;

    recordsMap.set(key, {
      id: r.id,
      service_order_id: r.service_order_id,
      os_short_id: so?.short_id ?? `OS-${r.service_order_id.slice(0, 6)}`,
      os_number: so?.os_number,
      equipment_desc: [so?.equipment_brand, so?.equipment_model].filter(Boolean).join(' '),
      technician_id: r.technician_id,
      technician_name: r.technician_name,
      labor_amount: labor,
      commission_rate: rate,
      commission_amount: comm,
      os_payment_status: r.os_payment_status,
      status: r.status,
      created_at: r.created_at,
    });
  });

  // A partir das service_orders caso o ledger ainda não tenha sido gerado
  serviceOrders.forEach((so) => {
    if (!so.technician_id || !so.technician) return;
    const key = `${so.id}-${so.technician_id}`;
    if (!recordsMap.has(key)) {
      const techProfile = Array.isArray(so.technician) ? so.technician[0] : so.technician;
      const techName = techProfile?.full_name ?? 'Técnico';
      const rate = getCommissionRate(techName, techProfile?.commission_rate);
      const labor = Number(so.labor_cost || 0);
      const comm = Math.round(labor * rate * 100) / 100;

      // Se filtro de status foi aplicado, respeitar
      if (params.status && params.status !== 'pending') return;

      recordsMap.set(key, {
        id: `virtual-${so.id}`,
        service_order_id: so.id,
        os_short_id: so.short_id ?? `OS-${so.os_number}`,
        os_number: so.os_number,
        technician_id: so.technician_id,
        technician_name: techName,
        labor_amount: labor,
        commission_rate: rate,
        commission_amount: comm,
        os_payment_status: so.payment_status || 'pending',
        status: 'pending',
        created_at: so.created_at,
      });
    }
  });

  const records = Array.from(recordsMap.values());

  // Totais agregados
  const totalLabor = serviceOrders.reduce((acc, so) => acc + Number(so.labor_cost || 0), 0);
  const totalParts = partsUsedTotal;
  const totalRevenue = totalLabor + totalParts;

  const totalCommission = records.reduce((acc, r) => acc + r.commission_amount, 0);
  const totalPending = records
    .filter((r) => r.status === 'pending')
    .reduce((acc, r) => acc + r.commission_amount, 0);
  const totalPaidOut = records
    .filter((r) => r.status === 'paid_out')
    .reduce((acc, r) => acc + r.commission_amount, 0);

  // Retenção da loja (Mão de Obra Total - Comissões Externas)
  const storeRetainedLabor = Math.max(0, totalLabor - totalCommission);

  // Totais por técnico
  const iagoPending = records
    .filter((r) => r.technician_name.toLowerCase().includes('iago') && r.status === 'pending')
    .reduce((acc, r) => acc + r.commission_amount, 0);

  const iagoTotal = records
    .filter((r) => r.technician_name.toLowerCase().includes('iago'))
    .reduce((acc, r) => acc + r.commission_amount, 0);

  const jeffersonPending = records
    .filter((r) => r.technician_name.toLowerCase().includes('jefferson') && r.status === 'pending')
    .reduce((acc, r) => acc + r.commission_amount, 0);

  const jeffersonTotal = records
    .filter((r) => r.technician_name.toLowerCase().includes('jefferson'))
    .reduce((acc, r) => acc + r.commission_amount, 0);

  // Helper para construir querystring
  const buildQuery = (newParams: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const current = {
      tech: params.tech,
      status: params.status,
      quinzena: params.quinzena,
      mes: params.mes,
      ...newParams,
    };
    Object.entries(current).forEach(([k, v]) => {
      if (v && v !== 'all') q.set(k, v);
    });
    const str = q.toString();
    return str ? `?${str}` : '';
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Stealth Carbono */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight text-white">
              Comissões & Extrato Quinzenal
            </h1>
          </div>
          <p className="mt-1 text-xs text-zinc-400">
            Cálculo pericial sobre mão de obra líquida: <span className="text-emerald-400 font-semibold">Iago 30%</span> (Balcão) · <span className="text-purple-400 font-semibold">Jefferson 50/50</span> (Mezanino/Telas/GPU) · <span className="text-zinc-300 font-semibold">Felipe/Loja 0%</span> (Margem Retida).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') window.print();
            }}
            className="rounded-md border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-xs font-mono font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white transition shadow-sm"
          >
            🖨️ Imprimir Extrato
          </button>
        </div>
      </div>

      {/* Grid de Resumo de Faturamento: Mão de Obra vs Peças */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Mão de Obra */}
        <div className="rounded-xl border border-zinc-800 bg-[#111114]/90 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Mão de Obra Total
            </p>
            <span className="rounded bg-emerald-950/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-emerald-400 border border-emerald-800/40">
              Serviços
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-white">{fmtBRL(totalLabor)}</p>
          <p className="mt-1 text-[11px] text-zinc-400">{serviceOrders.length} OSs no período</p>
        </div>

        {/* Total Peças */}
        <div className="rounded-xl border border-zinc-800 bg-[#111114]/90 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Peças Aplicadas
            </p>
            <span className="rounded bg-blue-950/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-blue-400 border border-blue-800/40">
              Estoque Eduardo
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-white">{fmtBRL(totalParts)}</p>
          <p className="mt-1 text-[11px] text-zinc-400">Custo direto repassado</p>
        </div>

        {/* Faturamento Bruto */}
        <div className="rounded-xl border border-zinc-800 bg-[#111114]/90 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Faturamento Bruto
            </p>
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-200">
              Total OS
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-emerald-400">{fmtBRL(totalRevenue)}</p>
          <p className="mt-1 text-[11px] text-zinc-400">Mão de obra + peças</p>
        </div>

        {/* Margem Retida da Loja (Felipe) */}
        <div className="rounded-xl border border-zinc-800 bg-[#111114]/90 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Loja / Felipe (Margem)
            </p>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono font-bold text-zinc-300">
              100% Retido
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-zinc-100">{fmtBRL(storeRetainedLabor)}</p>
          <p className="mt-1 text-[11px] text-zinc-400">Líquido após repasse técnico</p>
        </div>
      </div>

      {/* Grid de Repasse por Técnico */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Iago 30% */}
        <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400">
                Iago · Balcão
              </p>
              <p className="text-xs text-zinc-400">30% sobre mão de obra</p>
            </div>
            <span className="rounded bg-blue-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-blue-300 border border-blue-700/50">
              30%
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-xs text-zinc-400">A Pagar (Pendente):</p>
              <p className="text-xl font-black font-mono text-blue-300">{fmtBRL(iagoPending)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Total Período:</p>
              <p className="text-sm font-mono text-zinc-300 font-bold">{fmtBRL(iagoTotal)}</p>
            </div>
          </div>
        </div>

        {/* Jefferson 50% */}
        <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400">
                Jefferson · Mezanino
              </p>
              <p className="text-xs text-zinc-400">50/50 Celulares, OCA e GPU</p>
            </div>
            <span className="rounded bg-purple-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-purple-300 border border-purple-700/50">
              50%
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-xs text-zinc-400">A Pagar (Pendente):</p>
              <p className="text-xl font-black font-mono text-purple-300">{fmtBRL(jeffersonPending)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Total Período:</p>
              <p className="text-sm font-mono text-zinc-300 font-bold">{fmtBRL(jeffersonTotal)}</p>
            </div>
          </div>
        </div>

        {/* Total Comissões Pendentes vs Acertadas */}
        <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400">
                Total Comissões
              </p>
              <p className="text-xs text-zinc-400">Status de Acerto</p>
            </div>
            <span className="rounded bg-amber-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-700/50">
              Pendente
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <p className="text-xs text-zinc-400">Pendente de Acerto:</p>
              <p className="text-xl font-black font-mono text-amber-300">{fmtBRL(totalPending)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Já Acertado:</p>
              <p className="text-sm font-mono text-emerald-400 font-bold">{fmtBRL(totalPaidOut)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros: Quinzena, Técnico e Status */}
      <div className="rounded-xl border border-zinc-800 bg-[#111114]/90 p-4 shadow-lg backdrop-blur-md space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Seletor de Quinzena */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-zinc-500 uppercase tracking-wider mr-1">Quinzena:</span>
            <Link
              href={`/admin/comissoes${buildQuery({ quinzena: 'all' })}`}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition ${
                selectedQuinzena === 'all'
                  ? 'bg-white text-zinc-950 shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Mês Inteiro
            </Link>
            <Link
              href={`/admin/comissoes${buildQuery({ quinzena: '1' })}`}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition ${
                selectedQuinzena === '1'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              1ª Quinzena (01-15)
            </Link>
            <Link
              href={`/admin/comissoes${buildQuery({ quinzena: '2' })}`}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-semibold transition ${
                selectedQuinzena === '2'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              2ª Quinzena (16-fim)
            </Link>
          </div>

          {/* Filtro de Status de Pagamento da Comissão */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-mono text-zinc-500 uppercase tracking-wider mr-1">Status:</span>
            <Link
              href={`/admin/comissoes${buildQuery({ status: undefined })}`}
              className={`rounded-md px-2.5 py-1 text-xs font-mono transition ${
                !params.status ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </Link>
            <Link
              href={`/admin/comissoes${buildQuery({ status: 'pending' })}`}
              className={`rounded-md px-2.5 py-1 text-xs font-mono transition ${
                params.status === 'pending'
                  ? 'bg-amber-600/80 text-white border border-amber-500'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ⏳ Só Pendentes
            </Link>
            <Link
              href={`/admin/comissoes${buildQuery({ status: 'paid_out' })}`}
              className={`rounded-md px-2.5 py-1 text-xs font-mono transition ${
                params.status === 'paid_out'
                  ? 'bg-emerald-600/80 text-white border border-emerald-500'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ✓ Já Acertados
            </Link>
          </div>
        </div>

        {/* Filtro por Técnico */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/80 text-xs">
          <span className="font-mono text-zinc-500 uppercase tracking-wider mr-1">Técnico:</span>
          <Link
            href={`/admin/comissoes${buildQuery({ tech: undefined })}`}
            className={`rounded-md px-2.5 py-1 font-mono transition ${
              !params.tech ? 'bg-zinc-800 text-white border border-zinc-700' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todos os Técnicos
          </Link>
          {techList.map((t) => {
            const rate = getCommissionRate(t.full_name, t.commission_rate);
            const active = params.tech === t.id;
            return (
              <Link
                key={t.id}
                href={`/admin/comissoes${buildQuery({ tech: t.id })}`}
                className={`rounded-md px-2.5 py-1 font-mono transition ${
                  active
                    ? 'bg-blue-600 text-white border border-blue-500'
                    : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                }`}
              >
                {t.full_name} ({Math.round(rate * 100)}%)
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tabela de Lançamentos de Comissões */}
      {records.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-[#111114]/60 p-12 text-center">
          <p className="text-base font-semibold text-zinc-300">Nenhum registro de comissão encontrado.</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Nenhuma ordem de serviço com técnico atribuído e mão de obra registrada no período selecionado ({formatDateBR(startDate.toISOString())} a {formatDateBR(endDate.toISOString())}).
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#111114]/90 shadow-2xl backdrop-blur-md">
          <table className="min-w-full divide-y divide-zinc-800 text-left text-sm">
            <thead className="bg-zinc-900/80 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              <tr>
                <th className="px-4 py-3">OS / Aparelho</th>
                <th className="px-4 py-3">Técnico</th>
                <th className="px-4 py-3">Mão de Obra</th>
                <th className="px-4 py-3">Regra</th>
                <th className="px-4 py-3">Comissão</th>
                <th className="px-4 py-3">Pagamento OS</th>
                <th className="px-4 py-3">Status Acerto</th>
                <th className="px-4 py-3 text-right">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-mono text-xs text-zinc-200">
              {records.map((r) => {
                const isIago = r.technician_name.toLowerCase().includes('iago');
                const isJefferson = r.technician_name.toLowerCase().includes('jefferson');

                return (
                  <tr key={r.id} className="hover:bg-zinc-800/40 transition">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/os/${r.service_order_id}`}
                        className="font-bold text-white hover:text-emerald-400 transition"
                      >
                        #{r.os_short_id}
                      </Link>
                      {r.equipment_desc && (
                        <div className="text-[10px] text-zinc-400 font-sans">{r.equipment_desc}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-100">
                      {r.technician_name}
                    </td>
                    <td className="px-4 py-3 text-zinc-300">
                      {fmtBRL(r.labor_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isIago
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800/40'
                            : isJefferson
                            ? 'bg-purple-950/80 text-purple-300 border border-purple-800/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {Math.round(r.commission_rate * 100)}% {isJefferson ? '(50/50)' : isIago ? '(Balcão)' : '(Loja)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black text-sm text-emerald-400">
                      {fmtBRL(r.commission_amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          r.os_payment_status === 'paid'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                            : r.os_payment_status === 'partial'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {r.os_payment_status === 'paid'
                          ? 'Pago'
                          : r.os_payment_status === 'partial'
                          ? 'Parcial'
                          : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          r.status === 'paid_out'
                            ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                            : 'bg-amber-950/80 text-amber-400 border border-amber-800/40'
                        }`}
                      >
                        {r.status === 'paid_out' ? '✓ Acertado' : '⏳ Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-500 whitespace-nowrap text-[11px]">
                      {formatDateBR(r.created_at)}
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
