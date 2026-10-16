'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export type AppliedPart = {
  id: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  created_at: string;
  stock_item_id?: string;
  stock_item?: { id?: string; name: string; ean13?: string | null } | null;
};

export function AppliedPartsList({
  parts,
  serviceOrderId,
  osNumber,
  canEdit,
  isFinal,
  currentUserId,
}: {
  parts: AppliedPart[];
  serviceOrderId: string;
  osNumber?: string | number;
  canEdit: boolean;
  isFinal: boolean;
  currentUserId: string;
}) {
  const router = useRouter();
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!parts || parts.length === 0) return null;

  async function handleReversePart(part: AppliedPart) {
    const itemName = part.stock_item?.name || 'Peça';
    const ok = window.confirm(
      `Deseja estornar "${itemName}" (×${part.quantity})?\n\nA quantidade será devolvida ao estoque da loja e o valor será abatido da OS.`,
    );
    if (!ok) return;

    const itemId = part.stock_item_id || part.stock_item?.id;
    if (!itemId) {
      setError('ID do item de estoque não encontrado para devolução.');
      return;
    }

    setReversingId(part.id);
    setError(null);

    try {
      const supabase = createCRMBrowserClient();

      // 1. Registra movimentação de entrada (devolução) para recompor o saldo no estoque físico
      const { error: inErr } = await supabase.from('stock_movements').insert({
        stock_item_id: itemId,
        movement_type: 'in',
        quantity: part.quantity,
        unit_price: part.unit_price,
        total_amount: part.total_amount,
        notes: `Estorno/Devolução ao estoque da peça aplicada na OS #${osNumber || serviceOrderId.slice(0, 6)}`,
        author_id: currentUserId,
      });
      if (inErr) throw inErr;

      // 2. Remove o registro de saída vinculado a esta OS
      const { error: delErr } = await supabase
        .from('stock_movements')
        .delete()
        .eq('id', part.id);
      if (delErr) throw delErr;

      // 3. Atualiza o estimated_value da OS (subtraindo o valor da peça estornada)
      const { data: currentOS } = await supabase
        .from('service_orders')
        .select('estimated_value, labor_cost')
        .eq('id', serviceOrderId)
        .single();

      if (currentOS) {
        const currentEst = Number(currentOS.estimated_value || 0);
        const currentLabor = Number(currentOS.labor_cost || 0);
        const newEstimated = Math.max(currentLabor, Math.round((currentEst - Number(part.total_amount)) * 100) / 100);

        await supabase
          .from('service_orders')
          .update({
            estimated_value: newEstimated > 0 ? newEstimated : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', serviceOrderId);
      }

      // 4. Registra na linha do tempo da OS
      await supabase.from('service_order_events').insert({
        service_order_id: serviceOrderId,
        event_type: 'note_added',
        note: `Peça "${itemName}" (×${part.quantity} - R$ ${Number(part.total_amount).toFixed(2)}) foi estornada e devolvida ao estoque.`,
        author_id: currentUserId,
      });

      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setReversingId(null);
    }
  }

  return (
    <div className="border-t border-zinc-200 pt-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Peças aplicadas do estoque ({parts.length})
        </h3>
        {canEdit && !isFinal && (
          <span className="font-mono text-[10px] text-zinc-400">
            Clique no ícone de retorno para devolver ao estoque
          </span>
        )}
      </div>

      {error && (
        <p className="mt-1 border border-red-300 bg-red-50 p-1.5 font-mono text-xs text-red-700">
          {error}
        </p>
      )}

      <ul className="mt-2 divide-y divide-zinc-100 text-sm">
        {parts.map((p) => {
          const isReversing = reversingId === p.id;
          return (
            <li key={p.id} className="flex items-center justify-between py-1.5">
              <span className="text-zinc-900 flex items-center gap-1.5">
                <span>{p.stock_item?.name ?? '(item removido)'}</span>
                <span className="font-mono text-zinc-500">×{p.quantity}</span>
              </span>

              <div className="flex items-center gap-2">
                <span className="font-mono font-medium text-zinc-900">
                  R$ {Number(p.total_amount ?? 0).toFixed(2)}
                </span>

                {canEdit && !isFinal && (
                  <button
                    type="button"
                    onClick={() => handleReversePart(p)}
                    disabled={isReversing}
                    title="Estornar peça e devolver ao estoque"
                    className="border border-zinc-300 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-red-700 hover:border-red-600 hover:bg-red-50 hover:text-red-950 transition cursor-pointer disabled:opacity-50"
                  >
                    {isReversing ? 'Devolvendo…' : '↩ Devolver'}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
