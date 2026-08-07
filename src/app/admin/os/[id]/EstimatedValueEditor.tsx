'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

function parseBRL(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Orçamento (estimated_value) — coluna que já existia no schema desde
 * o início mas nunca tinha tela nenhuma pra preencher. Sem isso, o
 * valor combinado com o cliente não ficava registrado em lugar
 * nenhum: se ele dissesse depois "você falou R$200", não tinha como
 * conferir. Editável a qualquer momento (não só na aprovação) — o
 * técnico pode anotar assim que orça, antes até de ligar pro cliente.
 */
export function EstimatedValueEditor({
  osId,
  initialValue,
  canEdit,
}: {
  osId: string;
  initialValue: number | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    initialValue !== null ? initialValue.toFixed(2).replace('.', ',') : '',
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const num = parseBRL(value);
    if (value.trim() && num === null) {
      setError('Valor inválido.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: err } = await supabase
        .from('service_orders')
        .update({ estimated_value: num })
        .eq('id', osId);
      if (err) throw err;
      setEditing(false);
      setSaving(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <p className="text-sm">
          {initialValue !== null ? (
            <strong className="text-slate-900">{fmtBRL(initialValue)}</strong>
          ) : (
            <span className="text-slate-500">Ainda não orçado</span>
          )}
        </p>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            {initialValue !== null ? 'Editar' : 'Orçar'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="0,00"
        inputMode="decimal"
        className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setValue(initialValue !== null ? initialValue.toFixed(2).replace('.', ',') : '');
            setError(null);
          }}
          disabled={saving}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
