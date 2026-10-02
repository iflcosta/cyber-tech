'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { Modal } from '@/app/admin/components/Modal';

export function DeleteStockItemButton({
  itemId,
  itemName,
  hasSales,
  salesCount,
}: {
  itemId: string;
  itemName: string;
  hasSales: boolean;
  salesCount: number;
}) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteItem() {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: delErr } = await supabase
        .from('stock_items')
        .delete()
        .eq('id', itemId);
      if (delErr) throw delErr;
      setOpen(false);
      router.push('/admin/estoque');
      router.refresh();
    } catch (e) {
      const msg = (e as Error).message;
      // Erro de FK (item tem vendas)
      if (msg.includes('foreign key') || msg.includes('violates')) {
        setError(
          `Nao da pra deletar: item aparece em ${salesCount} ${salesCount === 1 ? 'venda' : 'vendas'}. Use 'Desativar' em vez disso (mantem o historico).`,
        );
      } else {
        setError(msg);
      }
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-2 border-red-500 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition cursor-pointer"
      >
        🗑️ Deletar
      </button>

      <Modal open={open} onClose={() => setOpen(false)} titleId={titleId}>
        <h2 id={titleId} className="font-mono text-lg font-black uppercase tracking-tight text-zinc-950">Deletar item</h2>
        <p className="mt-1 font-mono text-xs text-zinc-500">
          <strong className="text-zinc-950">{itemName}</strong>
        </p>

        {hasSales ? (
          <div className="mt-3 border border-amber-300 bg-amber-50 p-3 font-mono text-xs text-amber-950">
            <strong>Atenção:</strong> este item aparece em{' '}
            <strong>
              {salesCount} {salesCount === 1 ? 'venda' : 'vendas'}
            </strong>
            . Não dá pra deletar (quebra o histórico).
            <p className="mt-1">
              Use o botão <strong>Desativar</strong> ao lado — esconde da lista
              mas mantém o histórico de vendas.
            </p>
          </div>
        ) : (
          <div className="mt-3 border border-red-300 bg-red-50 p-3 font-mono text-xs text-red-950">
            <strong>Ação irreversível.</strong> O item será removido
            permanentemente. Como nunca foi vendido, dá pra deletar sem perder
            histórico.
          </div>
        )}

        {error && (
          <p className="mt-3 border border-red-300 bg-red-50 p-2 font-mono text-xs font-bold text-red-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2 border-t-2 border-zinc-200 pt-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={submitting}
            className="border-2 border-zinc-950 bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
          >
            Voltar
          </button>
          {!hasSales && (
            <button
              type="button"
              onClick={deleteItem}
              disabled={submitting}
              className="border-2 border-red-600 bg-red-600 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer"
            >
              {submitting ? 'Deletando…' : 'Deletar permanentemente'}
            </button>
          )}
        </div>
      </Modal>
    </>
  );
}
