import { redirect } from 'next/navigation';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { ReceivablesManager, type ReceivableItem } from './ReceivablesManager';

export const dynamic = 'force-dynamic';

export default async function ContasAReceberPage() {
  const { supabase, user, profile } = await getAuthedProfile();
  if (!user) redirect('/admin/login');

  // 1. Busca todas as OSs ativas ou entregues que podem ter saldo pendente
  const { data: osList, error: osErr } = await supabase
    .from('service_orders')
    .select(`
      id,
      os_number,
      short_id,
      customer_id,
      equipment_type,
      equipment_brand,
      equipment_model,
      reported_defect,
      status,
      estimated_value,
      labor_cost,
      technician_id,
      payment_status,
      created_at,
      updated_at,
      delivered_at,
      customer:customers(id, name, phone)
    `)
    .in('status', ['delivered', 'ready', 'in_progress', 'waiting_part', 'approved'])
    .order('updated_at', { ascending: false });

  if (osErr) {
    throw new Error(`Erro ao buscar ordens de serviço: ${osErr.message}`);
  }

  const osIds = (osList ?? []).map((o) => o.id);

  // 2. Busca peças utilizadas nessas OSs (stock_movements)
  const { data: movements } = osIds.length > 0
    ? await supabase
        .from('stock_movements')
        .select('service_order_id, total_amount')
        .in('service_order_id', osIds)
        .in('movement_type', ['out', 'sale'])
    : { data: [] };

  // 3. Busca pagamentos já realizados para essas OSs
  const { data: payments } = osIds.length > 0
    ? await supabase
        .from('service_order_payments')
        .select('id, service_order_id, amount, payment_method, paid_at')
        .in('service_order_id', osIds)
    : { data: [] };

  // 4. Busca sessão de caixa aberta no momento
  const { data: activeSessionRow } = await supabase
    .from('cash_sessions')
    .select('id, opened_at, operator:profiles!cash_sessions_operator_id_fkey(full_name)')
    .is('closed_at', null)
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Mapeia totais de peças por OS
  const partsByOS = new Map<string, number>();
  for (const m of movements ?? []) {
    if (m.service_order_id) {
      partsByOS.set(
        m.service_order_id,
        (partsByOS.get(m.service_order_id) ?? 0) + Number(m.total_amount || 0),
      );
    }
  }

  // Mapeia pagamentos efetuados por OS
  const paidByOS = new Map<string, number>();
  for (const p of payments ?? []) {
    if (p.service_order_id) {
      paidByOS.set(
        p.service_order_id,
        (paidByOS.get(p.service_order_id) ?? 0) + Number(p.amount || 0),
      );
    }
  }

  const nowMs = Date.now();
  const daysAgo = (dateStr?: string | null) => {
    if (!dateStr) return 0;
    return Math.max(0, Math.floor((nowMs - new Date(dateStr).getTime()) / 86400000));
  };

  // Consolidação de cada OS
  const receivables: ReceivableItem[] = [];

  for (const os of osList ?? []) {
    const partsTotal = Math.round((partsByOS.get(os.id) ?? 0) * 100) / 100;
    const labor = Number(os.labor_cost || 0);
    const est = Number(os.estimated_value || 0);
    const effectiveLabor = labor > 0 ? labor : Math.max(0, est - partsTotal);
    const grandTotal = Math.round((effectiveLabor + partsTotal) * 100) / 100;
    const totalPaid = Math.round((paidByOS.get(os.id) ?? 0) * 100) / 100;
    const remaining = Math.max(0, Math.round((grandTotal - totalPaid) * 100) / 100);

    // Consideramos apenas OSs com valor total > 0 e saldo devedor pendente (> R$ 0.10)
    // ou que não estejam com status pago
    if (grandTotal > 0 && remaining >= 0.10) {
      const cust = os.customer as unknown as { id: string; name: string; phone: string | null } | null;

      let daysWaiting = 0;
      if (os.status === 'delivered') {
        daysWaiting = daysAgo(os.delivered_at || os.updated_at);
      } else if (os.status === 'ready') {
        daysWaiting = daysAgo(os.updated_at);
      } else {
        daysWaiting = daysAgo(os.created_at);
      }

      receivables.push({
        id: os.id,
        os_number: os.os_number,
        short_id: os.short_id,
        status: os.status,
        equipment_type: os.equipment_type,
        equipment_brand: os.equipment_brand,
        equipment_model: os.equipment_model,
        reported_defect: os.reported_defect,
        customer_id: os.customer_id,
        customer_name: cust?.name ?? '(Cliente sem cadastro)',
        customer_phone: cust?.phone ?? null,
        labor_cost: effectiveLabor,
        parts_total: partsTotal,
        grand_total: grandTotal,
        total_paid: totalPaid,
        remaining,
        days_waiting: daysWaiting,
        delivered_at: os.delivered_at,
        updated_at: os.updated_at,
        created_at: os.created_at,
      });
    }
  }

  const activeCash = activeSessionRow
    ? {
        id: activeSessionRow.id,
        opened_at: activeSessionRow.opened_at,
        operator_name: (activeSessionRow.operator as any)?.full_name ?? undefined,
      }
    : null;

  return (
    <ReceivablesManager
      receivables={receivables}
      currentUserId={user.id}
      currentUserName={profile?.full_name ?? user.email ?? 'Operador'}
      activeCashSession={activeCash}
    />
  );
}
