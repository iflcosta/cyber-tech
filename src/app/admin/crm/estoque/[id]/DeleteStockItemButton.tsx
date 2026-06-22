'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';

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
      router.push('/admin/crm/estoque');
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
        className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        🗑️ Deletar
      </button>

      {open && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-slate-900">Deletar item</h2>
            <p className="mt-1 text-sm text-slate-500">
              <strong>{itemName}</strong>
            </p>

            {hasSales ? (
              <div className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                <strong>Atenção:</strong> este item aparece em{' '}
                <strong>
                  {salesCount} {salesCount === 1 ? 'venda' : 'vendas'}
                </strong>
                . Nao da pra deletar (quebra o historico).
                <p className="mt-1">
                  Use o botao <strong>Desativar</strong> ao lado — esconde da lista
                  mas mantem o historico de vendas.
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-900">
                <strong>Acao irreversivel.</strong> O item sera removido
                permanentemente. Como nunca foi vendido, da pra deletar sem perder
                historico.
              </div>
            )}

            {error && (
              <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
              >
                Voltar
              </button>
              {!hasSales && (
                <button
                  type="button"
                  onClick={deleteItem}
                  disabled={submitting}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {submitting ? 'Deletando…' : 'Deletar permanentemente'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
