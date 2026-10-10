import Link from 'next/link';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { formatDateBR, getFridayCycleBounds } from '@/app/admin/lib/datetime';
import { CommissionsSpreadsheet, SpreadsheetRecord } from './CommissionsSpreadsheet';

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
    periodo?: string;
    quinzena?: string;
    mes?: string;
    dias_balcao?: string;
  }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) return null;

  const currentUserName = profile?.full_name ?? '';
  const isCurrentUserIago = currentUserName.toLowerCase().includes('iago');
  const isCurrentUserJefferson = currentUserName.toLowerCase().includes('jefferson');
  const isOwnerOrManager = Boolean(profile?.can_delete) || isCurrentUserIago || (profile?.role === 'owner' && !isCurrentUserJefferson);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const selectedMonth = params.mes || currentMonthStr;
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // Por padrão, se não passou período específico, mostra todas as PENDÊNCIAS ativas para garantir que nenhum valor suma no sábado
  const selectedPeriodo = params.periodo || 'pendentes';

  let startDate: Date;
  let endDate: Date;
  let periodLabel: string;

  if (selectedPeriodo === 'pendentes') {
    startDate = new Date(Date.now() - 30 * 86400000);
    endDate = new Date(Date.now() + 86400000);
    periodLabel = 'Lançamentos Pendentes de Acerto (Ativo)';
  } else if (selectedPeriodo === 'semana') {
    const bounds = getFridayCycleBounds(now, 0);
    startDate = bounds.start;
    endDate = bounds.end;
    periodLabel = `Semana Atual (Fechamento Sexta ${formatDateBR(endDate.toISOString())})`;
  } else if (selectedPeriodo === 'semana_anterior') {
    const bounds = getFridayCycleBounds(now, -1);
    startDate = bounds.start;
    endDate = bounds.end;
    periodLabel = `Semana Anterior (Fechada ${formatDateBR(endDate.toISOString())})`;
  } else if (selectedPeriodo === 'quinzena_1') {
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    endDate = new Date(year, month - 1, 15, 23, 59, 59, 999);
    periodLabel = `1ª Quinzena (${selectedMonth})`;
  } else if (selectedPeriodo === 'quinzena_2') {
    startDate = new Date(year, month - 1, 16, 0, 0, 0, 0);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
    periodLabel = `2ª Quinzena (${selectedMonth})`;
  } else if (selectedPeriodo === 'todos') {
    startDate = new Date(2026, 0, 1);
    endDate = new Date(Date.now() + 86400000);
    periodLabel = 'Todos os Registros';
  } else {
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);
    endDate = new Date(year, month, 0, 23, 59, 59, 999);
    periodLabel = `Mês Inteiro (${selectedMonth})`;
  }

  // 1. Busca perfis e técnicos
  const { data: technicians } = await supabase
    .from('profiles')
    .select('id, full_name, role, commission_rate')
    .order('full_name');

  const techList = technicians ?? [];

  const getCommissionRate = (techName: string, rateFromDb?: number): number => {
    const nameLower = (techName || '').toLowerCase();
    if (nameLower.includes('iago')) return 0.30;
    if (nameLower.includes('jefferson')) return 0.50;
    if (nameLower.includes('felipe')) return 0.00;
    if (rateFromDb !== undefined && rateFromDb !== null) return Number(rateFromDb);
    return 0.00;
  };

  // 2. Busca lançamentos em commission_ledger com joins completos
  let ledgerQuery = supabase
    .from('commission_ledger')
    .select(`
      *,
      service_orders(
        id, short_id, os_number, equipment_brand, equipment_model, status, payment_status, labor_cost, created_at,
        customer:customers(name)
      )
    `)
    .order('created_at', { ascending: false });

  if (selectedPeriodo === 'pendentes') {
    ledgerQuery = ledgerQuery.eq('status', 'pending');
  } else if (selectedPeriodo !== 'todos') {
    ledgerQuery = ledgerQuery.gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString());
  }

  if (params.tech) {
    ledgerQuery = ledgerQuery.eq('technician_id', params.tech);
  }
  if (params.status && selectedPeriodo !== 'pendentes') {
    ledgerQuery = ledgerQuery.eq('status', params.status);
  }

  const { data: ledgerData } = await ledgerQuery;

  // 3. Busca também todas as pendências ativas globais para os cards de topo
  const { data: allPendingLedger } = await supabase
    .from('commission_ledger')
    .select('*')
    .eq('status', 'pending');

  const pendingRows = allPendingLedger ?? [];
  const globalIagoPending = pendingRows
    .filter((r) => r.technician_name.toLowerCase().includes('iago'))
    .reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);

  const globalJeffersonPending = pendingRows
    .filter((r) => r.technician_name.toLowerCase().includes('jefferson'))
    .reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);

  const globalTotalPendingOS = pendingRows.reduce(
    (acc, r) => acc + Number(r.commission_amount || 0),
    0
  );

  // Normaliza os registros para a Planilha
  const spreadsheetRecords: SpreadsheetRecord[] = (ledgerData ?? []).map((r) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const so = r.service_orders as any;
    const rate = getCommissionRate(r.technician_name, r.commission_rate);
    const labor = Number(r.labor_amount || 0);
    const comm = Number(r.commission_amount || 0) > 0 ? Number(r.commission_amount) : Math.round(labor * rate * 100) / 100;

    return {
      id: r.id,
      service_order_id: r.service_order_id,
      os_short_id: so?.short_id ?? `OS-${r.service_order_id.slice(0, 6)}`,
      os_number: so?.os_number,
      customer_name: so?.customer?.name,
      equipment_desc: [so?.equipment_brand, so?.equipment_model].filter(Boolean).join(' '),
      service_description: r.service_description || 'Mão de obra geral',
      service_order_service_id: r.service_order_service_id,
      technician_id: r.technician_id,
      technician_name: r.technician_name,
      labor_amount: labor,
      commission_rate: rate,
      commission_amount: comm,
      os_status: so?.status,
      os_payment_status: r.os_payment_status || so?.payment_status || 'pending',
      status: r.status,
      payout_date: r.payout_date,
      created_at: r.created_at,
    };
  });

  // Política de remuneração do Iago: R$ 100/semana fixa (período da tarde)
  const isNewPolicyFromOct5 = endDate >= new Date('2026-10-05T00:00:00');
  const DAILY_BALCAO_RATE = isNewPolicyFromOct5 ? 20 : 50;
  const WEEKLY_FIXED_RATE = isNewPolicyFromOct5 ? 100 : 250;

  const defaultBalcaoDays = 5;
  const parsedBalcaoDays = params.dias_balcao !== undefined ? parseInt(params.dias_balcao, 10) : defaultBalcaoDays;
  const iagoBalcaoDays = Number.isFinite(parsedBalcaoDays) && parsedBalcaoDays >= 0 ? parsedBalcaoDays : defaultBalcaoDays;
  const iagoBalcaoAllowance =
    isNewPolicyFromOct5 && params.dias_balcao === undefined
      ? WEEKLY_FIXED_RATE
      : iagoBalcaoDays * DAILY_BALCAO_RATE;

  const iagoTotalWithFixed = globalIagoPending + iagoBalcaoAllowance;

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
    const s = q.toString();
    return s ? `?${s}` : '';
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO BRUTALISTA DO MÓDULO DE COMISSÕES */}
      <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-zinc-950 text-white font-mono text-xs font-bold px-2 py-0.5 uppercase tracking-widest">
                FINANCEIRO // BANCADA
              </span>
              <span className="font-mono text-xs text-zinc-500">
                Modelo Planilha Reativa &amp; Rateio Multi-Técnico
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-zinc-950">
              Comissões, Rateio de Mão de Obra &amp; Acertos
            </h1>
            <p className="mt-1 font-mono text-xs text-zinc-600">
              {periodLabel} · Visualização em alta densidade com rateio de procedimentos fracionados.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <Link
              href="/admin/os"
              className="border border-zinc-300 bg-zinc-50 px-3 py-1.5 font-bold uppercase text-zinc-800 hover:bg-zinc-200"
            >
              ← Voltar às OSs
            </Link>
          </div>
        </div>
      </div>

      {/* CARDS RESUMO DE FECHAMENTO (VALORES MANTIDOS ATÉ A BAIXA) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-2 border-zinc-950 bg-zinc-950 gap-[1px]">
        {/* Iago 30% + Fixo da Tarde */}
        {(isOwnerOrManager || isCurrentUserIago) && (
          <div className={`p-4 transition ${isCurrentUserIago ? 'bg-emerald-50/80 ring-2 ring-emerald-600 ring-inset' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black uppercase text-zinc-950">
                Iago // Tarde {isCurrentUserIago && <span className="bg-emerald-600 text-white px-1 ml-1 text-[9px]">VOCÊ</span>}
              </span>
              <span className="border border-zinc-950 bg-zinc-950 text-white px-1.5 py-0.5 font-mono text-[10px] font-bold">
                30% + R$ 100 Fixo
              </span>
            </div>
            <p className="mt-2 text-2xl font-black font-mono text-emerald-950">
              {fmtBRL(iagoTotalWithFixed)}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-600">
              OS 30%: {fmtBRL(globalIagoPending)} + Fixo: {fmtBRL(iagoBalcaoAllowance)}
            </p>
          </div>
        )}

        {/* Jefferson 50% */}
        {(isOwnerOrManager || isCurrentUserJefferson) && (
          <div className={`p-4 transition ${isCurrentUserJefferson ? 'bg-blue-50/80 ring-2 ring-blue-600 ring-inset' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black uppercase text-zinc-950">
                Jefferson // 50/50 {isCurrentUserJefferson && <span className="bg-blue-600 text-white px-1 ml-1 text-[9px]">VOCÊ</span>}
              </span>
              <span className="border border-zinc-950 bg-zinc-100 text-zinc-950 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                50% Cel/Placas
              </span>
            </div>
            <p className="mt-2 text-2xl font-black font-mono text-blue-950">
              {fmtBRL(globalJeffersonPending)}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-600">
              Total de comissão pendente (50%)
            </p>
          </div>
        )}

        {/* Total a Pagar da Loja */}
        {isOwnerOrManager && (
          <div className="bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black uppercase text-zinc-950">
                Total A Pagar aos Técnicos
              </span>
              <span className="border border-amber-300 bg-amber-50 text-amber-900 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                A QUITAR
              </span>
            </div>
            <p className="mt-2 text-2xl font-black font-mono text-zinc-950">
              {fmtBRL(globalTotalPendingOS + iagoBalcaoAllowance)}
            </p>
            <p className="mt-1 font-mono text-[11px] text-zinc-500">
              Comissões OS ({fmtBRL(globalTotalPendingOS)}) + Fixo Iago
            </p>
          </div>
        )}

        {/* Status Geral de Fechamento */}
        {isOwnerOrManager && (
          <div className="bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black uppercase text-zinc-950">
                Status do Acerto
              </span>
              <span className="border border-zinc-300 bg-zinc-100 text-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                FECHAMENTO
              </span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
              <p className="text-sm font-black font-mono text-zinc-950">
                {pendingRows.length > 0 ? `${pendingRows.length} Lançamentos Pendentes` : 'Tudo Quitado'}
              </p>
            </div>
            <p className="mt-1 font-mono text-[11px] text-zinc-500">
              Valores mantidos ativos até o clique de baixa
            </p>
          </div>
        )}
      </div>

      {/* BARRA DE NAVEGAÇÃO DE CICLOS E PERIODOS */}
      <div className="border-2 border-zinc-950 bg-white p-3 font-mono text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-zinc-500 uppercase tracking-wider mr-1">Exibição:</span>
          <Link
            href={`/admin/comissoes${buildQuery({ periodo: 'pendentes' })}`}
            className={`px-3 py-1 font-bold uppercase transition flex items-center gap-1.5 ${
              selectedPeriodo === 'pendentes'
                ? 'bg-zinc-950 text-white'
                : 'border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Acerto Pendente (Ativo)
          </Link>
          <Link
            href={`/admin/comissoes${buildQuery({ periodo: 'semana_anterior' })}`}
            className={`px-3 py-1 font-bold uppercase transition ${
              selectedPeriodo === 'semana_anterior'
                ? 'bg-zinc-950 text-white'
                : 'border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-200'
            }`}
          >
            Ciclo Anterior (03/10 a 09/10)
          </Link>
          <Link
            href={`/admin/comissoes${buildQuery({ periodo: 'semana' })}`}
            className={`px-3 py-1 font-bold uppercase transition ${
              selectedPeriodo === 'semana'
                ? 'bg-zinc-950 text-white'
                : 'border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-200'
            }`}
          >
            Semana Atual (10/10 a 16/10)
          </Link>
          <Link
            href={`/admin/comissoes${buildQuery({ periodo: 'mes' })}`}
            className={`px-3 py-1 font-bold uppercase transition ${
              selectedPeriodo === 'mes'
                ? 'bg-zinc-950 text-white'
                : 'border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-200'
            }`}
          >
            Mês Inteiro
          </Link>
          <Link
            href={`/admin/comissoes${buildQuery({ periodo: 'todos' })}`}
            className={`px-3 py-1 font-bold uppercase transition ${
              selectedPeriodo === 'todos'
                ? 'bg-zinc-950 text-white'
                : 'border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-200'
            }`}
          >
            Todos os Lançamentos
          </Link>
        </div>

        {/* Ajuste de dias de balcão do Iago se necessário */}
        {(isOwnerOrManager || isCurrentUserIago) && (
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500 font-bold uppercase text-[11px]">Dias Balcão Iago:</span>
            {[0, 3, 4, 5].map((d) => (
              <Link
                key={d}
                href={`/admin/comissoes${buildQuery({ dias_balcao: String(d) })}`}
                className={`px-2 py-0.5 font-bold transition ${
                  iagoBalcaoDays === d
                    ? 'bg-zinc-950 text-white'
                    : 'border border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {d}d
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* PLANILHA INTERATIVA REATIVA */}
      <CommissionsSpreadsheet
        records={spreadsheetRecords}
        technicians={techList}
        currentUserId={user.id}
        currentUserName={currentUserName}
        isOwnerOrManager={isOwnerOrManager}
        iagoFixedAllowance={iagoBalcaoAllowance}
      />
    </div>
  );
}
