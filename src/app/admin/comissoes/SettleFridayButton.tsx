'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

type PendingSettlementItem = {
  id: string;
  service_order_id: string;
  technician_id: string;
  technician_name: string;
  labor_amount: number;
  commission_rate: number;
  commission_amount: number;
  os_payment_status: string;
};

export function SettleFridayButton({
  pendingItems,
  pendingTotal,
  periodLabel,
}: {
  pendingItems: PendingSettlementItem[];
  pendingTotal: number;
  periodLabel: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [settledSuccess, setSettledSuccess] = useState(false);

  const fmtBRL = (n: number) =>
    n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  async function handleSettleWeek() {
    if (pendingItems.length === 0) return;

    const confirmMsg = `Confirmar a BAIXA SEMANAL DE SEXTA-FEIRA (${periodLabel})?\n\nTotal a acertar: ${fmtBRL(
      pendingTotal
    )} (${pendingItems.length} ${pendingItems.length === 1 ? 'OS' : 'OSs'}).\n\nTodos os lançamentos pendentes deste período serão marcados como "Acertado / Pago".`;

    if (typeof window !== 'undefined' && !window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    setSettledSuccess(false);

    try {
      const supabase = createCRMBrowserClient();

      const realLedgerIds = pendingItems
        .filter((i) => !i.id.startsWith('virtual-'))
        .map((i) => i.id);

      const virtualItems = pendingItems.filter((i) => i.id.startsWith('virtual-'));

      if (realLedgerIds.length > 0) {
        const { error: updErr } = await supabase
          .from('commission_ledger')
          .update({
            status: 'paid_out',
            payout_date: new Date().toISOString(),
          })
          .in('id', realLedgerIds);

        if (updErr) throw updErr;
      }

      if (virtualItems.length > 0) {
        const rowsToInsert = virtualItems.map((v) => ({
          service_order_id: v.service_order_id,
          technician_id: v.technician_id,
          technician_name: v.technician_name,
          labor_amount: v.labor_amount,
          commission_rate: v.commission_rate,
          commission_amount: v.commission_amount,
          os_payment_status: v.os_payment_status,
          status: 'paid_out',
          payout_date: new Date().toISOString(),
        }));

        const { error: insErr } = await supabase
          .from('commission_ledger')
          .upsert(rowsToInsert, { onConflict: 'service_order_id,technician_id' });

        if (insErr) throw insErr;
      }

      setSettledSuccess(true);
      router.refresh();
    } catch (err) {
      if (typeof window !== 'undefined') {
        window.alert(`Erro ao dar baixa nas comissões: ${(err as Error).message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined') window.print();
        }}
        className="border-2 border-zinc-950 bg-white px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
      >
        Imprimir Extrato
      </button>

      {pendingItems.length > 0 ? (
        <button
          type="button"
          onClick={handleSettleWeek}
          disabled={loading}
          className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition disabled:opacity-50 cursor-pointer"
        >
          {loading
            ? 'Processando Baixa…'
            : `Dar Baixa de Sexta-Feira (${fmtBRL(pendingTotal)})`}
        </button>
      ) : (
        <span className="inline-flex items-center gap-1.5 border-2 border-zinc-950 bg-zinc-100 px-3.5 py-2 font-mono text-xs font-bold uppercase text-zinc-950">
          ✓ Comissões da Semana em Dia
        </span>
      )}

      {settledSuccess && (
        <span className="font-mono text-xs font-bold text-zinc-950">
          [OK] Baixa realizada!
        </span>
      )}
    </div>
  );
}
