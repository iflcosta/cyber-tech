'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseBRL(v: string): number {
  if (!v.trim()) return 0;
  const normalized = v.includes(',')
    ? v.replace(/\./g, '').replace(',', '.')
    : v;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function RepairNotesEditor({
  osId,
  initialNotes,
  initialLaborCost,
  partsTotal = 0,
  canEdit,
}: {
  osId: string;
  initialNotes: string;
  initialLaborCost: number;
  partsTotal?: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [labor, setLabor] = useState(
    initialLaborCost > 0 ? initialLaborCost.toFixed(2).replace('.', ',') : '',
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLabor(initialLaborCost > 0 ? initialLaborCost.toFixed(2).replace('.', ',') : '');
  }, [initialLaborCost]);

  const liveLaborNum = parseBRL(labor);
  const liveGrandTotal = liveLaborNum + partsTotal;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const laborNum = parseBRL(labor);
      const totalEstimated = laborNum + partsTotal;

      const { error: err } = await supabase
        .from('service_orders')
        .update({
          repair_notes: notes,
          labor_cost: laborNum,
          estimated_value: totalEstimated > 0 ? totalEstimated : null,
        })
        .eq('id', osId);
      if (err) {
        setError('Erro: ' + err.message);
        setSaving(false);
        return;
      }
      setSaved(true);
      setSaving(false);
      router.refresh();
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError('Erro inesperado: ' + (e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
          Laudo técnico / serviço executado
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!canEdit}
          rows={3}
          placeholder="Descreva o diagnóstico constatado e o serviço realizado na bancada..."
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-zinc-50 disabled:text-zinc-500"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:items-end">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-zinc-600">
            Valor do Serviço / Mão de Obra (R$)
          </label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute left-3 top-2 text-sm text-zinc-500">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={labor}
              onChange={(e) => setLabor(e.target.value)}
              disabled={!canEdit}
              placeholder="0,00"
              className="block w-full rounded-md border border-zinc-300 bg-white py-2 pl-10 pr-3 font-mono text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:bg-zinc-50 disabled:text-zinc-500"
            />
          </div>
        </div>

        <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs">
          <div className="flex items-center justify-between text-zinc-600">
            <span>Serviço: <strong className="font-mono text-zinc-900">{fmtBRL(liveLaborNum)}</strong></span>
            <span>Peças: <strong className="font-mono text-zinc-900">{fmtBRL(partsTotal)}</strong></span>
          </div>
          <div className="mt-1 flex items-center justify-between border-t border-zinc-200 pt-1 text-sm font-bold text-zinc-950">
            <span>Total da OS:</span>
            <span className="font-mono">{fmtBRL(liveGrandTotal)}</span>
          </div>
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors cursor-pointer"
          >
            {saving ? 'Salvando...' : 'Salvar diagnóstico e valor'}
          </button>
          {saved && <span className="text-xs font-medium text-zinc-900">✓ Salvo com sucesso</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      )}
    </div>
  );
}