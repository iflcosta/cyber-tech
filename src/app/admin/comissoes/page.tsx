import Link from 'next/link';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { formatDateBR } from '@/app/admin/lib/datetime';
import { SettleFridayButton } from './SettleFridayButton';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Calcula o ciclo semanal de fechamento na Sexta-Feira (Sábado 00:00 até Sexta-Feira 23:59:59).
 * Na Cyber Informática, o Felipe dá baixa nas comissões toda sexta-feira.
 */
function getFridayCycleBounds(refDate: Date, weekOffset = 0): { start: Date; end: Date } {
  const d = new Date(refDate);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const daysSinceSaturday = (day + 1) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - daysSinceSaturday + weekOffset * 7);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{
    tech?: string;
    status?: string;
    periodo?: string;
    quinzena?: string;
    mes?: string;
    dias_balcao?: string;
  }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await getAuthedProfile();
  if (!user) return null;

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = params.mes || currentMonthStr;
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const selectedPeriodo = params.periodo || (params.quinzena ? `quinzena_${params.quinzena}` : 'semana');

  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  if (selectedPeriodo === 'semana') {
    const bounds = getFridayCycleBounds(now, 0);
    startDate = bounds.start;
    endDate = bounds.end;
    periodLabel = `Semana Atual (Fechamento Sexta ${formatDateBR(endDate.toISOString())})`;
  } else if (selectedPeriodo === 'semana_anterior') {
    const bounds = getFridayCycleBounds(now, -1);
    startDate = bounds.start;
    endDate = bounds.end;
    periodLabel = `Semana Anterior (Fechamento Sexta ${formatDateBR(endDate.toISOString())})`;
  } else if (selectedPeriodo === 'quinzena_1') {
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    endDate = new Date(year, month - 1, 15, 23, 59, 59, 999);
    periodLabel = `1ª Quinzena (${selectedMonth})`;
  } else if (selectedPeriodo === 'quinzena_2') {
    startDate = new Date(year, month - 1, 16, 0, 0, 0, 0);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
    periodLabel = `2ª Quinzena (${selectedMonth})`;
  } else {
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
    periodLabel = `Mês Inteiro (${selectedMonth})`;
  }

  // 1. Busca técnicos cadastrados (usando select('*') para funcionar antes e depois da migration 0034)
  const { data: technicians } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  const techList = (technicians ?? []) as Array<{
    id: string;
    full_name: string;
    role: string;
    commission_rate?: number;
  }>;

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
  const migrationPending = Boolean(ledgerError && ledgerError.code === 'PGRST205');

  // 3. Busca OSs do período com fallback resiliente se technician_id ainda não existir
  let soQuery = supabase
    .from('service_orders')
    .select(`
      id, os_number, short_id, labor_cost, status, payment_status, technician_id, created_by, created_at,
      technician:profiles!service_orders_technician_id_fkey(id, full_name)
    `)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (params.tech) {
    soQuery = soQuery.eq('technician_id', params.tech);
  }

  let { data: serviceOrdersData, error: soError } = await soQuery;

  if (soError) {
    let fallbackSoQuery = supabase
      .from('service_orders')
      .select(`
        id, os_number, short_id, labor_cost, status, payment_status, created_by, created_at,
        creator:profiles!service_orders_created_by_fkey(id, full_name)
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false });

    if (params.tech) {
      fallbackSoQuery = fallbackSoQuery.eq('created_by', params.tech);
    }

    const fb = await fallbackSoQuery;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    serviceOrdersData = (fb.data ?? []).map((row: any) => ({
      ...row,
      technician_id: row.created_by,
      technician: row.creator,
    }));
  }

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

  serviceOrders.forEach((so) => {
    const techId = so.technician_id || so.created_by;
    if (!techId) return;
    const key = `${so.id}-${techId}`;
    if (!recordsMap.has(key)) {
      const techProfile = Array.isArray(so.technician) ? so.technician[0] : so.technician;
      const matchedFromList = techList.find((t) => t.id === techId);
      const techName = techProfile?.full_name ?? matchedFromList?.full_name ?? 'Técnico';
      const rate = getCommissionRate(techName, matchedFromList?.commission_rate);
      const labor = Number(so.labor_cost || 0);
      const comm = Math.round(labor * rate * 100) / 100;

      if (params.status && params.status !== 'pending') return;

      recordsMap.set(key, {
        id: `virtual-${so.id}`,
        service_order_id: so.id,
        os_short_id: so.short_id ?? `OS-${so.os_number}`,
        os_number: so.os_number,
        technician_id: techId,
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
  const pendingRecords = records.filter((r) => r.status === 'pending' && r.commission_amount > 0);

  const totalLabor = serviceOrders.reduce((acc, so) => acc + Number(so.labor_cost || 0), 0);
  const totalParts = partsUsedTotal;
  const totalRevenue = totalLabor + totalParts;

  const totalCommission = records.reduce((acc, r) => acc + r.commission_amount, 0);
  const totalPending = pendingRecords.reduce((acc, r) => acc + r.commission_amount, 0);
  const totalPaidOut = records
    .filter((r) => r.status === 'paid_out')
    .reduce((acc, r) => acc + r.commission_amount, 0);

  const storeRetainedLabor = Math.max(0, totalLabor - totalCommission);

  const DAILY_BALCAO_RATE = 50;
  const defaultBalcaoDays =
    selectedPeriodo === 'semana' || selectedPeriodo === 'semana_anterior'
      ? 5
      : selectedPeriodo === 'quinzena_1' || selectedPeriodo === 'quinzena_2'
      ? 11
      : 22;
  const parsedBalcaoDays =
    params.dias_balcao !== undefined ? parseInt(params.dias_balcao, 10) : defaultBalcaoDays;
  const iagoBalcaoDays = Number.isFinite(parsedBalcaoDays) && parsedBalcaoDays >= 0 ? parsedBalcaoDays : defaultBalcaoDays;
  const iagoBalcaoAllowance = iagoBalcaoDays * DAILY_BALCAO_RATE;

  const iagoPending = records
    .filter((r) => r.technician_name.toLowerCase().includes('iago') && r.status === 'pending')
    .reduce((acc, r) => acc + r.commission_amount, 0);

  const iagoTotal = records
    .filter((r) => r.technician_name.toLowerCase().includes('iago'))
    .reduce((acc, r) => acc + r.commission_amount, 0);

  const iagoFridayTotalWithAllowance = iagoPending + iagoBalcaoAllowance;

  const jeffersonPending = records
    .filter((r) => r.technician_name.toLowerCase().includes('jefferson') && r.status === 'pending')
    .reduce((acc, r) => acc + r.commission_amount, 0);

  const jeffersonTotal = records
    .filter((r) => r.technician_name.toLowerCase().includes('jefferson'))
    .reduce((acc, r) => acc + r.commission_amount, 0);

  const buildQuery = (newParams: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const current = {
      tech: params.tech,
      status: params.status,
      periodo: params.periodo,
      mes: params.mes,
      dias_balcao: params.dias_balcao,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-950 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-950">
              Comissões &amp; Fechamento de Sexta-Feira
            </h1>
            <span className="border border-zinc-950 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              Baixa Semanal
            </span>
          </div>
          <p className="mt-1 font-mono text-xs text-zinc-600">
            Regras de rateio:{' '}
            <strong className="text-zinc-950">Iago 30% + R$ 50/dia</strong> (Balcão) ·{' '}
            <strong className="text-zinc-950">Jefferson 50/50</strong> (Mezanino/Telas/GPU) ·{' '}
            <strong className="text-zinc-950">Felipe/Loja 0%</strong> (Margem Retida) ·{' '}
            <span>
              [{formatDateBR(startDate.toISOString())} a {formatDateBR(endDate.toISOString())}]
            </span>
          </p>
        </div>

        <SettleFridayButton
          pendingItems={pendingRecords.map((r) => ({
            id: r.id,
            service_order_id: r.service_order_id,
            technician_id: r.technician_id,
            technician_name: r.technician_name,
            labor_amount: r.labor_amount,
            commission_rate: r.commission_rate,
            commission_amount: r.commission_amount,
            os_payment_status: r.os_payment_status,
          }))}
          pendingTotal={totalPending}
          periodLabel={periodLabel}
        />
      </div>

      {migrationPending && (
        <div className="border-2 border-zinc-950 bg-zinc-100 p-4 font-mono text-xs text-zinc-900">
          <p className="font-bold uppercase">
            [AVISO DE BANCO DE DADOS] A tabela `commission_ledger` (Migration 0034) ainda não foi executada no SQL Editor do Supabase.
          </p>
          <p className="mt-1 text-zinc-600">
            O painel já está calculando as comissões em tempo real diretamente das Ordens de Serviço (`service_orders`). Para habilitar a gravação permanente da baixa de sexta-feira, execute o arquivo `supabase/PRODUCAO_MIGRACAO_COMPLETA.sql` no SQL Editor do Supabase.
          </p>
        </div>
      )}

      {/* Grid de Resumo de Faturamento: Mão de Obra vs Peças */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-2 border-zinc-950 bg-zinc-950 gap-[1px]">
        <div className="bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Mão de Obra Total
            </p>
            <span className="border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-zinc-800">
              Serviços
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-zinc-950">{fmtBRL(totalLabor)}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">{serviceOrders.length} OSs no período</p>
        </div>

        <div className="bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Peças Aplicadas
            </p>
            <span className="border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-zinc-800">
              Estoque Eduardo
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-zinc-950">{fmtBRL(totalParts)}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">Custo direto repassado</p>
        </div>

        <div className="bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Faturamento Bruto
            </p>
            <span className="border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-zinc-800">
              Total OS
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-zinc-950">{fmtBRL(totalRevenue)}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">Mão de obra + peças</p>
        </div>

        <div className="bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500">
              Loja / Felipe (Margem)
            </p>
            <span className="border border-zinc-950 bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              Retido Loja
            </span>
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-zinc-950">{fmtBRL(storeRetainedLabor)}</p>
          <p className="mt-1 font-mono text-xs text-zinc-500">Líquido após repasse técnico</p>
        </div>
      </div>

      {/* Grid de Repasse por Técnico */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-2 border-zinc-950 bg-zinc-950 gap-[1px]">
        {/* Iago 30% + Diária de Balcão R$ 50/dia */}
        <div className="bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-wider text-zinc-950">
                Iago // Balcão &amp; Bancada
              </p>
              <p className="font-mono text-[11px] text-zinc-500">30% mão de obra + R$ 50/dia balcão</p>
            </div>
            <span className="border border-zinc-950 bg-zinc-950 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
              30% + R$ 50/d
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="font-mono text-[11px] text-zinc-500">Total Sexta (Comissão + {iagoBalcaoDays}d):</p>
              <p className="text-2xl font-black font-mono text-zinc-950">{fmtBRL(iagoFridayTotalWithAllowance)}</p>
              <p className="text-[11px] font-mono text-zinc-600 mt-0.5">
                OS 30%: {fmtBRL(iagoPending)} + Balcão: {fmtBRL(iagoBalcaoAllowance)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[11px] text-zinc-500">Só Comissão:</p>
              <p className="text-sm font-mono text-zinc-900 font-bold">{fmtBRL(iagoTotal)}</p>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-zinc-200 flex items-center justify-between font-mono text-[11px]">
            <span className="text-zinc-600 font-bold uppercase">Dias no balcão:</span>
            <div className="flex items-center gap-1">
              {[0, 3, 4, 5, 6].map((d) => (
                <Link
                  key={d}
                  href={`/admin/comissoes${buildQuery({ dias_balcao: String(d) })}`}
                  className={`px-2 py-0.5 font-mono font-bold transition ${
                    iagoBalcaoDays === d
                      ? 'bg-zinc-950 text-white'
                      : 'border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-200'
                  }`}
                >
                  {d}d
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Jefferson 50% */}
        <div className="bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-wider text-zinc-950">
                Jefferson // 2º Andar
              </p>
              <p className="font-mono text-[11px] text-zinc-500">50/50 Celulares, OCA e GPU</p>
            </div>
            <span className="border border-zinc-950 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-950">
              50 / 50
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="font-mono text-[11px] text-zinc-500">A Pagar na Sexta:</p>
              <p className="text-2xl font-black font-mono text-zinc-950">{fmtBRL(jeffersonPending)}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[11px] text-zinc-500">Total Período:</p>
              <p className="text-sm font-mono text-zinc-900 font-bold">{fmtBRL(jeffersonTotal)}</p>
            </div>
          </div>
        </div>

        {/* Total Comissões Pendentes vs Acertadas */}
        <div className="bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-mono text-xs font-black uppercase tracking-wider text-zinc-950">
                Fechamento de Sexta-Feira
              </p>
              <p className="font-mono text-[11px] text-zinc-500">Status de Baixa Semanal</p>
            </div>
            <span className="border border-zinc-950 bg-zinc-100 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-950">
              SEXTA-FEIRA
            </span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <div>
              <p className="font-mono text-[11px] text-zinc-500">Pendente de Baixa (OS):</p>
              <p className="text-2xl font-black font-mono text-zinc-950">{fmtBRL(totalPending)}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[11px] text-zinc-500">Já Baixado:</p>
              <p className="text-sm font-mono text-zinc-900 font-bold">{fmtBRL(totalPaidOut)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de Filtros: Ciclo Semanal de Sexta-Feira, Técnico e Status */}
      <div className="border-2 border-zinc-950 bg-white p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <span className="font-bold text-zinc-500 uppercase tracking-wider mr-1">Ciclo de Baixa:</span>
            <Link
              href={`/admin/comissoes${buildQuery({ periodo: 'semana' })}`}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition ${
                selectedPeriodo === 'semana'
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
              }`}
            >
              Semana Atual (Sexta)
            </Link>
            <Link
              href={`/admin/comissoes${buildQuery({ periodo: 'semana_anterior' })}`}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition ${
                selectedPeriodo === 'semana_anterior'
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
              }`}
            >
              Semana Anterior
            </Link>
            <Link
              href={`/admin/comissoes${buildQuery({ periodo: 'mes' })}`}
              className={`px-3 py-1.5 text-xs font-bold uppercase transition ${
                selectedPeriodo === 'mes' || selectedPeriodo === 'quinzena_all'
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 bg-zinc-100 text-zinc-800 hover:bg-zinc-200'
              }`}
            >
              Mês Inteiro
            </Link>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className="font-bold text-zinc-500 uppercase tracking-wider mr-1">Status:</span>
            <Link
              href={`/admin/comissoes${buildQuery({ status: undefined })}`}
              className={`px-2.5 py-1 text-xs font-bold uppercase transition ${
                !params.status ? 'bg-zinc-950 text-white' : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Todos
            </Link>
            <Link
              href={`/admin/comissoes${buildQuery({ status: 'pending' })}`}
              className={`px-2.5 py-1 text-xs font-bold uppercase transition ${
                params.status === 'pending'
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Só Pendentes
            </Link>
            <Link
              href={`/admin/comissoes${buildQuery({ status: 'paid_out' })}`}
              className={`px-2.5 py-1 text-xs font-bold uppercase transition ${
                params.status === 'paid_out'
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Já Acertados
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200 font-mono text-xs">
          <span className="font-bold text-zinc-500 uppercase tracking-wider mr-1">Técnico:</span>
          <Link
            href={`/admin/comissoes${buildQuery({ tech: undefined })}`}
            className={`px-2.5 py-1 font-bold uppercase transition ${
              !params.tech ? 'bg-zinc-950 text-white' : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100'
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
                className={`px-2.5 py-1 font-bold uppercase transition ${
                  active
                    ? 'bg-zinc-950 text-white'
                    : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100'
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
        <div className="border-2 border-dashed border-zinc-300 bg-white p-12 text-center font-mono">
          <p className="text-sm font-bold uppercase text-zinc-800">Nenhum registro de comissão encontrado.</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Nenhuma ordem de serviço com técnico atribuído e mão de obra registrada no período selecionado ({formatDateBR(startDate.toISOString())} a {formatDateBR(endDate.toISOString())}).
          </p>
        </div>
      ) : (
        <div className="overflow-hidden border-2 border-zinc-950 bg-white">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
            <thead className="border-b-2 border-zinc-950 bg-zinc-100 font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-700">
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
            <tbody className="divide-y divide-zinc-200 text-xs text-zinc-800">
              {records.map((r) => {
                const isIago = r.technician_name.toLowerCase().includes('iago');
                const isJefferson = r.technician_name.toLowerCase().includes('jefferson');

                return (
                  <tr key={r.id} className="hover:bg-zinc-50 transition">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/os/${r.service_order_id}`}
                        className="font-mono font-bold text-zinc-950 hover:underline transition"
                      >
                        #{r.os_short_id}
                      </Link>
                      {r.equipment_desc && (
                        <div className="text-[11px] text-zinc-500">{r.equipment_desc}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-zinc-950">
                      {r.technician_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-zinc-800">
                      {fmtBRL(r.labor_amount)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="inline-block border border-zinc-950 bg-zinc-100 px-2 py-0.5 text-[10px] font-bold uppercase text-zinc-950">
                        {Math.round(r.commission_rate * 100)}% {isJefferson ? '(50/50)' : isIago ? '(Balcão)' : '(Loja)'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-black text-sm text-zinc-950">
                      {fmtBRL(r.commission_amount)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase ${
                          r.os_payment_status === 'paid'
                            ? 'bg-zinc-950 text-white'
                            : 'border border-zinc-300 bg-zinc-100 text-zinc-700'
                        }`}
                      >
                        {r.os_payment_status === 'paid'
                          ? 'Pago'
                          : r.os_payment_status === 'partial'
                          ? 'Parcial'
                          : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase ${
                          r.status === 'paid_out'
                            ? 'bg-zinc-950 text-white'
                            : 'border border-zinc-950 bg-white text-zinc-950'
                        }`}
                      >
                        {r.status === 'paid_out' ? '✓ Acertado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-zinc-500 whitespace-nowrap text-[11px]">
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
