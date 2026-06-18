'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';

export function OSChargePanel({
  osId,
  currentUserId,
  currentUserName,
  priceValue,
  priceStatus,
  canEdit,
  pixKey,
}: {
  osId: string;
  currentUserId: string;
  currentUserName: string;
  priceValue: number | null;
  priceStatus: 'pending' | 'paid' | null;
  canEdit: boolean;
  pixKey: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [newValue, setNewValue] = useState<string>(priceValue ? String(priceValue) : '');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!canEdit && !priceValue) return null;

  async function saveValue() {
    const v = parseFloat(newValue.replace(',', '.'));
    if (isNaN(v) || v < 0) return;
    setSaving(true);
    try {
      const supabase = createCRMBrowserClient();
      const { error } = await supabase
        .from('service_orders')
        .update({ price_value: v, price_status: 'pending' })
        .eq('id', osId);
      if (error) throw error;
      await supabase.from('service_order_events').insert({
        service_order_id: osId,
        event_type: 'note_added',
        note: `Valor definido: R$ ${v.toFixed(2)} (aguardando pagamento)`,
        author_id: currentUserId,
      });
      setEditing(false);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function markPaid() {
    if (!confirm('Confirmar que o pagamento foi recebido?')) return;
    setSaving(true);
    try {
      const supabase = createCRMBrowserClient();
      const { error } = await supabase
        .from('service_orders')
        .update({ price_status: 'paid' })
        .eq('id', osId);
      if (error) throw error;
      await supabase.from('service_order_events').insert({
        service_order_id: osId,
        event_type: 'part_resolved',
        note: `Pagamento confirmado por ${currentUserName}`,
        author_id: currentUserId,
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  function copyPix() {
    navigator.clipboard.writeText(pixKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className={`rounded-lg border p-4 sm:p-5 ${
      priceStatus === 'paid'
        ? 'border-emerald-200 bg-emerald-50'
        : priceValue
        ? 'border-amber-200 bg-amber-50'
        : 'border-slate-200 bg-white'
    }`}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cobrança</h2>

      {editing ? (
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <span className="flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-2 text-sm text-slate-600">R$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="0,00"
              className="flex-1 rounded-r-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={saveValue}
              disabled={saving || !newValue}
              className="flex-1 rounded-md bg-blue-600 px-2 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      ) : priceValue ? (
        <div className="mt-2 space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">
              R$ {priceValue.toFixed(2)}
            </span>
            {priceStatus === 'paid' ? (
              <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                ✓ Pago
              </span>
            ) : (
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                ⏳ Pendente
              </span>
            )}
          </div>

          {priceStatus !== 'paid' && (
            <>
              <div className="rounded-md border border-slate-200 bg-white p-2">
                <p className="text-xs text-slate-500">PIX Copia e Cola:</p>
                <p className="mt-1 break-all font-mono text-xs text-slate-800">{pixKey}</p>
              </div>
              <button
                type="button"
                onClick={copyPix}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {copied ? '✓ Chave copiada!' : '📋 Copiar chave PIX'}
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={markPaid}
                  disabled={saving}
                  className="w-full rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : '✓ Marcar como pago'}
                </button>
              )}
            </>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              Editar valor
            </button>
          )}
        </div>
      ) : canEdit ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 w-full rounded-md border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-600 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700"
        >
          💰 Definir valor do serviço
        </button>
      ) : (
        <p className="mt-2 text-sm text-slate-500">Sem valor definido.</p>
      )}
    </section>
  );
}
