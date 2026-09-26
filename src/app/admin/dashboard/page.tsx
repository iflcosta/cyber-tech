import Link from 'next/link';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { resolveUserContext } from '@/app/admin/lib/rbac';
import { PAYMENT_METHODS } from '@/app/admin/types/database';
import { PixQRButton } from '@/app/admin/components/PixQRButton';
import { formatDateTimeBR, startOfDayBR, startOfMonthBR } from '@/app/admin/lib/datetime';
import { SalesChart, DayPoint } from './SalesChart';
import { DashboardTacticalBar } from './DashboardTacticalBar';
import { AttentionRadar } from './AttentionRadar';
import { FacilityLevelSplit } from './FacilityLevelSplit';
import { CommissionsSummary } from './CommissionsSummary';
import { StockAndSalesGiro } from './StockAndSalesGiro';

const CHART_DAYS = 14;
const TZ = 'America/Sao_Paulo';

export const dynamic = 'force-dynamic';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getFridayCycleBounds(refDate: Date): { start: Date; end: Date; label: string } {
  const d = new Date(refDate);
  d.setHours(12, 0, 0, 0);
  const day = d.getDay();
  const daysSinceSaturday = (day + 1) % 7;
  const start = new Date(d);
  start.setDate(d.getDate() - daysSinceSaturday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const fmt = (dt: Date) => dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return { start, end, label: `Fechamento Sexta-Feira (${fmt(start)} a ${fmt(end)})` };
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) return null;

  // 1. Resolução do Contexto e Papéis RBAC
  const userCtx = resolveUserContext(user, profile, params.role);

  // 2. Janelas de tempo — no fuso de Brasília (BRT)
  const now = new Date();
  const todayStart = startOfDayBR();
  const chartStart = new Date(todayStart.getTime() - (CHART_DAYS - 1) * 86400000);
  const monthStart = startOfMonthBR();
  const fridayCycle = getFridayCycleBounds(now);

  // 3. Status de Conexão da Evolution API na VPS (com timeout rápido de contingência)
  let vpsConnected = false;
  try {
    const vpsRes = await fetch(
      `${process.env.CYBER_VPS_WA_URL || 'http://148.113.247.44:8085'}/instance/connectionState/cyber-loja`,
      {
        headers: { apikey: process.env.CYBER_VPS_WA_KEY || 'cyber_wa_sec_2026_braganca_ifl' },
        cache: 'no-store',
        signal: AbortSignal.timeout(1800),
      }
    );
    if (vpsRes.ok) {
      const vpsData = await vpsRes.json();
      vpsConnected = (vpsData?.instance?.state || vpsData?.state) === 'open';
    }
  } catch {
    vpsConnected = false;
  }

  // 4. Consultas paralelas e resilientes ao Supabase CRM
  const [
    salesLast14Days,
    salesMonth,
    lastSales,
    topItems,
    stockItemsRes,
    osOpen,
    osStale,
    osReady,
    osDeliveredMonth,
    unpaidList,
    staleList,
    readyList,
    commissionLedgerMonth,
    partsOrderedMonth,
  ] = await Promise.all([
    // Vendas dos últimos 14 dias para o gráfico e tendências
    supabase
      .from('sales')
      .select('total, created_at')
      .is('voided_at', null)
      .gte('created_at', chartStart.toISOString()),

    // Vendas do mês atual
    supabase
      .from('sales')
      .select('total')
      .is('voided_at', null)
      .gte('created_at', monthStart.toISOString()),

    // Últimas 6 vendas registradas no PDV
    supabase
      .from('sales')
      .select(`
        id, sale_number, total, payment_method, customer_name, created_at,
        author:profiles!sales_author_id_fkey(full_name)
      `)
      .is('voided_at', null)
      .order('created_at', { ascending: false })
      .limit(6),

    // Itens mais vendidos no balcão no mês
    supabase
      .from('sale_items')
      .select('item_name, quantity, subtotal, sale:sales!inner(created_at, voided_at)')
      .gte('sale.created_at', monthStart.toISOString())
      .is('sale.voided_at', null)
      .limit(500),

    // Estoque do Eduardo (Catálogo da estante de 6m)
    supabase
      .from('stock_items')
      .select('id, name, current_stock, min_stock, unit_price, internal_sku, category')
      .order('name'),

    // Contagem de OSs abertas
    supabase
      .from('service_orders_with_stale')
      .select('id', { count: 'exact', head: true }),

    // Contagem de OSs paradas (≥ 3 dias sem movimentação)
    supabase
      .from('service_orders_with_stale')
      .select('id', { count: 'exact', head: true })
      .gte('days_since_update', 3),

    // Contagem de OSs prontas para retirada no balcão
    supabase
      .from('service_orders')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ready'),

    // OSs entregues no mês (para telemetria por nível e cálculo de mão de obra)
    supabase
      .from('service_orders')
      .select('id, labor_cost, equipment_type, reported_defect, technician_id, delivered_at')
      .eq('status', 'delivered')
      .gte('delivered_at', monthStart.toISOString()),

    // OSs entregues sem pagamento integral
    supabase
      .from('service_orders')
      .select('id, short_id, os_number, customer:customers(name), delivered_at, labor_cost, estimated_value')
      .eq('status', 'delivered')
      .in('payment_status', ['pending', 'partial'])
      .order('delivered_at', { ascending: true })
      .limit(6),

    // Lista detalhada de OSs paradas (para o Radar de Atenção)
    supabase
      .from('service_orders_with_stale')
      .select('id, short_id, os_number, customer_name, days_since_update, equipment_type')
      .gte('days_since_update', 3)
      .order('days_since_update', { ascending: false })
      .limit(6),

    // Lista de OSs prontas no balcão (para o Radar de Atenção)
    supabase
      .from('service_orders')
      .select('id, short_id, os_number, customer:customers(name), updated_at, equipment_type')
      .eq('status', 'ready')
      .order('updated_at', { ascending: true })
      .limit(6),

    // Lançamentos no livro-razão de comissões (migration 0034)
    supabase
      .from('commission_ledger')
      .select('technician_name, labor_amount, commission_rate, commission_amount, status, created_at')
      .gte('created_at', fridayCycle.start.toISOString())
      .lte('created_at', fridayCycle.end.toISOString()),

    // Peças de fornecedores pedidas no mês (apenas para Dono / Dev)
    userCtx.canViewSupplierCosts
      ? supabase
          .from('part_orders')
          .select('part_value, supplier:suppliers(name)')
          .neq('status', 'cancelled')
          .gte('created_at', monthStart.toISOString())
      : Promise.resolve({ data: [] }),
  ]);

  // 5. Normalização de dados do Estoque do Eduardo
  const allStockItems = stockItemsRes.data ?? [];
  const lowStockItems = allStockItems.filter(
    (item) => item.min_stock !== null && item.current_stock <= (item.min_stock ?? 0)
  );

  const stockStats = {
    totalItems: allStockItems.length,
    totalUnits: allStockItems.reduce((acc, it) => acc + (it.current_stock || 0), 0),
    totalStockValue: allStockItems.reduce(
      (acc, it) => acc + (it.current_stock || 0) * Number(it.unit_price || 0),
      0
    ),
    lowStockCount: lowStockItems.length,
  };

  // 6. Agrupamento dos itens mais vendidos no balcão (Top 5)
  const itemAgg = new Map<string, { name: string; qty: number; total: number }>();
  for (const row of topItems.data ?? []) {
    const key = row.item_name;
    const existing = itemAgg.get(key);
    if (existing) {
      existing.qty += row.quantity;
      existing.total += Number(row.subtotal);
    } else {
      itemAgg.set(key, {
        name: row.item_name,
        qty: row.quantity,
        total: Number(row.subtotal),
      });
    }
  }
  const topItemsSorted = Array.from(itemAgg.values())
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // 7. Buckets diários para o Gráfico de Vendas CIS-01 (14 dias)
  const dayBuckets: DayPoint[] = Array.from({ length: CHART_DAYS }, (_, i) => {
    const start = new Date(chartStart.getTime() + i * 86400000);
    return {
      start,
      weekday: new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, weekday: 'short' })
        .format(start)
        .replace('.', ''),
      dateLabel: new Intl.DateTimeFormat('pt-BR', { timeZone: TZ, day: '2-digit', month: '2-digit' }).format(start),
      total: 0,
      count: 0,
      isToday: i === CHART_DAYS - 1,
    };
  });

  for (const row of salesLast14Days.data ?? []) {
    const idx = Math.round((new Date(row.created_at).getTime() - chartStart.getTime()) / 86400000);
    if (idx >= 0 && idx < CHART_DAYS) {
      dayBuckets[idx].total += Number(row.total);
      dayBuckets[idx].count += 1;
    }
  }

  const todayBucket = dayBuckets[CHART_DAYS - 1];
  const yesterdayBucket = dayBuckets[CHART_DAYS - 2];
  const last7 = dayBuckets.slice(CHART_DAYS - 7);
  const prev7 = dayBuckets.slice(CHART_DAYS - 14, CHART_DAYS - 7);

  const totalToday = todayBucket.total;
  const countToday = todayBucket.count;
  const totalWeek = last7.reduce((acc, d) => acc + d.total, 0);
  const countWeek = last7.reduce((acc, d) => acc + d.count, 0);
  const totalPrevWeek = prev7.reduce((acc, d) => acc + d.total, 0);

  const totalMonthSales = (salesMonth.data ?? []).reduce(
    (acc, r) => acc + Number(r.total || 0),
    0
  );
  const countMonthSales = salesMonth.data?.length ?? 0;

  const trend = (curr: number, prev: number): { pct: number; up: boolean } | null => {
    if (prev <= 0) return null;
    const pct = Math.round(((curr - prev) / prev) * 100);
    return { pct, up: pct >= 0 };
  };
  const todayTrend = trend(totalToday, yesterdayBucket.total);
  const weekTrend = trend(totalWeek, totalPrevWeek);

  // 8. Segregação de Produção por Andar: Nível 01 (Térreo) vs Nível 02 (Mezanino)
  const deliveredOSs = osDeliveredMonth.data ?? [];
  let terreoOSCount = 0;
  let terreoLaborRevenue = 0;
  let mezaninoOSCount = 0;
  let mezaninoLaborRevenue = 0;
  let mezaninoScreensCount = 0;
  let mezaninoGpusCount = 0;

  for (const os of deliveredOSs) {
    const type = (os.equipment_type || '').toLowerCase();
    const defect = (os.reported_defect || '').toLowerCase();
    const labor = Number(os.labor_cost || 0);

    const isMezaninoItem =
      /celular|smartphone|iphone|tablet|display|tela|vidro|oca|bga|gpu|placa de v[íi]deo|reballing/.test(
        `${type} ${defect}`
      );

    if (isMezaninoItem) {
      mezaninoOSCount += 1;
      mezaninoLaborRevenue += labor;
      if (/tela|display|vidro|oca/.test(`${type} ${defect}`)) mezaninoScreensCount += 1;
      if (/gpu|placa de v[íi]deo|bga|reballing/.test(`${type} ${defect}`)) mezaninoGpusCount += 1;
    } else {
      terreoOSCount += 1;
      terreoLaborRevenue += labor;
    }
  }

  const terreoStats = {
    osCount: terreoOSCount,
    laborRevenue: terreoLaborRevenue,
    pdvSalesCount: countMonthSales,
    pdvRevenue: totalMonthSales,
  };

  const mezaninoStats = {
    osCount: mezaninoOSCount,
    laborRevenue: mezaninoLaborRevenue,
    screensCount: mezaninoScreensCount,
    gpusCount: mezaninoGpusCount,
  };

  // 9. Cálculo de Comissões por Técnico (Ciclo Semanal Sexta-Feira)
  let iagoCommissionTotal = 0;
  let iagoLaborTotal = 0;
  let iagoOSCount = 0;

  let jeffersonCommissionTotal = 0;
  let jeffersonLaborTotal = 0;
  let jeffersonOSCount = 0;

  const ledgerRows = commissionLedgerMonth.data ?? [];
  if (ledgerRows.length > 0) {
    for (const row of ledgerRows) {
      const name = (row.technician_name || '').toLowerCase();
      const comm = Number(row.commission_amount || 0);
      const labor = Number(row.labor_amount || 0);

      if (name.includes('iago')) {
        iagoCommissionTotal += comm;
        iagoLaborTotal += labor;
        iagoOSCount += 1;
      } else if (name.includes('jefferson')) {
        jeffersonCommissionTotal += comm;
        jeffersonLaborTotal += labor;
        jeffersonOSCount += 1;
      }
    }
  } else {
    // Fallback matemático se a tabela commission_ledger estiver vazia no período
    for (const os of deliveredOSs) {
      const type = (os.equipment_type || '').toLowerCase();
      const defect = (os.reported_defect || '').toLowerCase();
      const labor = Number(os.labor_cost || 0);
      const isMezanino = /celular|smartphone|iphone|tablet|tela|vidro|bga|gpu/.test(`${type} ${defect}`);

      if (isMezanino) {
        jeffersonLaborTotal += labor;
        jeffersonCommissionTotal += labor * 0.50;
        jeffersonOSCount += 1;
      } else {
        iagoLaborTotal += labor;
        iagoCommissionTotal += labor * 0.30;
        iagoOSCount += 1;
      }
    }
  }

  const totalCommissions = iagoCommissionTotal + jeffersonCommissionTotal;
  const totalLaborRevenueMonth = terreoLaborRevenue + mezaninoLaborRevenue;
  // Lucro retido da loja = Mão de Obra Total - Comissões pagas aos técnicos
  const storeRetainedProfit = Math.max(0, totalLaborRevenueMonth - totalCommissions);

  // 10. Normalização de Alertas de Atenção Imediata
  const nowMs = Date.now();
  const daysAgo = (dateStr: string) => Math.max(0, Math.floor((nowMs - new Date(dateStr).getTime()) / 86400000));

  type CustomerRel = { name: string } | null;
  type ReadyRow = { id: string; short_id: string | null; os_number: string | null; customer: CustomerRel; updated_at: string; equipment_type?: string };
  type UnpaidRow = { id: string; short_id: string | null; os_number: string | null; customer: CustomerRel; delivered_at: string | null; labor_cost: number; estimated_value: number | null };

  const readyItems = ((readyList.data ?? []) as unknown as ReadyRow[]).map((o) => ({
    id: o.id,
    short_id: o.short_id,
    os_number: o.os_number,
    customer_name: o.customer?.name ?? '(cliente)',
    daysReady: daysAgo(o.updated_at),
    equipment: o.equipment_type,
  }));

  const unpaidItems = ((unpaidList.data ?? []) as unknown as UnpaidRow[]).map((o) => ({
    id: o.id,
    short_id: o.short_id,
    os_number: o.os_number,
    customer_name: o.customer?.name ?? '(cliente)',
    daysUnpaid: o.delivered_at ? daysAgo(o.delivered_at) : 0,
    amount: (o.estimated_value || 0) + (o.labor_cost || 0),
  }));

  const staleItems = (staleList.data ?? []).map((o) => ({
    id: o.id,
    short_id: o.short_id,
    os_number: o.os_number,
    customer_name: o.customer_name ?? '(cliente)',
    days_since_update: o.days_since_update ?? 3,
    equipment: o.equipment_type,
  }));

  return (
    <div className="space-y-6">
      {/* 1. Cabeçalho CIS-01 com Identificação do Usuário e Metrologia */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b-2 border-zinc-950 gap-3 font-mono">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
              CYBER INSTRUMENTATION SYSTEM // ERP COCKPIT
            </span>
            <span className="text-[10px] bg-zinc-950 text-white px-2 py-0.5 font-bold uppercase">
              {userCtx.name} ({userCtx.effectiveRole})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-zinc-950">
            Painel de Controle Operacional.
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <PixQRButton
            buttonLabel="⚡ PIX AVULSO"
            description="Pagamento avulso Cyber Informática"
            buttonClassName="inline-flex items-center gap-2 border-2 border-zinc-950 bg-white hover:bg-zinc-950 text-zinc-950 hover:text-white px-3.5 py-2 text-xs font-mono font-bold uppercase transition shadow-xs"
          />
        </div>
      </div>

      {/* 2. Barramento Tático de Ações Rápidas & Seletor de Simulação Dev */}
      <DashboardTacticalBar userCtx={userCtx} vpsConnected={vpsConnected} />

      {/* 3. Radar de Atenção Imediata (Gargalos do Dia) */}
      <AttentionRadar
        userCtx={userCtx}
        staleOSs={staleItems}
        readyOSs={readyItems}
        unpaidOSs={unpaidItems}
        lowStockItems={lowStockItems}
      />

      {/* 4. Resumo de Faturamento Consolidado (Exclusivo Dono / Desenvolvedor) */}
      {userCtx.canViewStoreFinancials && (
        <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 text-zinc-950 font-mono space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
                CONSOLIDAÇÃO FINANCEIRA // LOJA FÍSICA
              </span>
              <h2 className="text-xs sm:text-sm font-black uppercase text-zinc-950">
                Faturamento & Indicadores de Vendas
              </h2>
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 font-bold uppercase">
              VISÃO GERENCIAL FELIPE
            </span>
          </div>

          {/* Cards de Métricas Principais */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-zinc-300 bg-zinc-50 p-4">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">VENDAS PDV (HOJE)</span>
              <span className="text-xl sm:text-2xl font-black text-zinc-950 block">
                {fmtBRL(totalToday)}
              </span>
              <div className="mt-1 text-[11px] text-zinc-600 flex items-center gap-2">
                <span>{countToday} vendas</span>
                {todayTrend && (
                  <span className={`font-bold px-1 py-0.2 border text-[10px] ${todayTrend.up ? 'text-emerald-800 bg-emerald-50 border-emerald-300' : 'text-rose-800 bg-rose-50 border-rose-300'}`}>
                    {todayTrend.up ? '▲ +' : '▼ '}{Math.abs(todayTrend.pct)}% vs ontem
                  </span>
                )}
              </div>
            </div>

            <div className="border border-zinc-300 bg-zinc-50 p-4">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">ÚLTIMOS 7 DIAS</span>
              <span className="text-xl sm:text-2xl font-black text-zinc-950 block">
                {fmtBRL(totalWeek)}
              </span>
              <div className="mt-1 text-[11px] text-zinc-600 flex items-center gap-2">
                <span>{countWeek} vendas</span>
                {weekTrend && (
                  <span className={`font-bold px-1 py-0.2 border text-[10px] ${weekTrend.up ? 'text-emerald-800 bg-emerald-50 border-emerald-300' : 'text-rose-800 bg-rose-50 border-rose-300'}`}>
                    {weekTrend.up ? '▲ +' : '▼ '}{Math.abs(weekTrend.pct)}% vs sem. ant.
                  </span>
                )}
              </div>
            </div>

            <div className="border border-zinc-300 bg-zinc-50 p-4">
              <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">FATURAMENTO PDV (MÊS)</span>
              <span className="text-xl sm:text-2xl font-black text-zinc-950 block">
                {fmtBRL(totalMonthSales)}
              </span>
              <span className="mt-1 text-[11px] text-zinc-600 block">{countMonthSales} vendas no mês</span>
            </div>

            <div className="border-2 border-emerald-600 bg-emerald-50/60 p-4">
              <span className="text-[10px] text-emerald-800 font-black uppercase block mb-1">MÃO DE OBRA TOTAL (MÊS)</span>
              <span className="text-xl sm:text-2xl font-black text-emerald-950 block">
                {fmtBRL(totalLaborRevenueMonth)}
              </span>
              <span className="mt-1 text-[11px] text-emerald-700 font-medium block">{deliveredOSs.length} máquinas entregues</span>
            </div>
          </div>

          {/* Gráfico de Vendas 14 Dias */}
          <div className="border border-zinc-300 bg-zinc-50 p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase text-zinc-950">
                Histórico Diário de Vendas (Últimos 14 Dias)
              </span>
              <span className="text-[10px] font-bold text-zinc-500">BRT FUSO HORÁRIO</span>
            </div>
            <SalesChart data={dayBuckets} showValues={true} />
          </div>
        </section>
      )}

      {/* 5. Telemetria dos Dois Andares: Térreo vs Mezanino */}
      <FacilityLevelSplit
        userCtx={userCtx}
        terreoStats={terreoStats}
        mezaninoStats={mezaninoStats}
      />

      {/* 6. Livro-Razão de Comissões & Lucro Retido da Loja */}
      <CommissionsSummary
        userCtx={userCtx}
        cycleLabel={fridayCycle.label}
        totalPendingPayout={totalCommissions}
        storeRetainedProfit={storeRetainedProfit}
        iagoStats={{
          laborTotal: iagoLaborTotal,
          commissionTotal: iagoCommissionTotal,
          osCount: iagoOSCount,
          status: 'pending',
        }}
        jeffersonStats={{
          laborTotal: jeffersonLaborTotal,
          commissionTotal: jeffersonCommissionTotal,
          osCount: jeffersonOSCount,
          status: 'pending',
        }}
      />

      {/* 7. Giro de Estoque do Eduardo & Mais Vendidos no Balcão */}
      <StockAndSalesGiro
        userCtx={userCtx}
        stockStats={stockStats}
        topItems={topItemsSorted}
      />

      {/* 8. Feed em Tempo Real das Últimas Vendas */}
      <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 text-zinc-950 font-mono space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              REGISTRO DE OPERAÇÕES // BALCÃO
            </span>
            <h2 className="text-xs sm:text-sm font-black uppercase text-zinc-950">
              Últimas Vendas no PDV
            </h2>
          </div>
          <Link
            href="/admin/vendas"
            className="text-xs text-zinc-600 hover:text-zinc-950 font-bold underline"
          >
            Ver Todas as Vendas →
          </Link>
        </div>

        {(lastSales.data ?? []).length === 0 ? (
          <p className="text-xs text-zinc-500 py-3">Nenhuma venda registrada ainda no período.</p>
        ) : (
          <div className="divide-y divide-zinc-200 text-xs">
            {(lastSales.data ?? []).map((s) => {
              const payMeta = PAYMENT_METHODS.find((m) => m.value === s.payment_method);
              const authorName = Array.isArray(s.author)
                ? (s.author[0] as { full_name?: string })?.full_name
                : (s.author as { full_name?: string } | null)?.full_name;
              return (
                <div key={s.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/admin/vendas/${s.id}`}
                      className="font-bold text-zinc-950 hover:underline block"
                    >
                      {s.sale_number}
                    </Link>
                    <p className="text-[11px] text-zinc-600">
                      {formatDateTimeBR(s.created_at)} ·{' '}
                      {authorName || 'Balcão'} · {payMeta?.label ?? s.payment_method}
                      {s.customer_name && ` · ${s.customer_name}`}
                    </p>
                  </div>
                  {userCtx.canViewSalesFinancials && (
                    <strong className="text-sm font-black text-zinc-950">
                      {fmtBRL(s.total)}
                    </strong>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
