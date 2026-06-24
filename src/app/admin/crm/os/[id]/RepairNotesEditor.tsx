'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';

export function RepairNotesEditor({
  osId,
  initialNotes,
  initialLaborCost,
  canEdit,
}: {
  osId: string;
  initialNotes: string;
  initialLaborCost: number;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [labor, setLabor] = useState(String(initialLaborCost ?? 0));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const laborNum = Number(labor) || 0;
      const { error: err } = await supabase
        .from('service_orders')
        .update({
          repair_notes: notes,
          labor_cost: laborNum,
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
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError('Erro inesperado: ' + (e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Diagnóstico / reparo executado
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={!canEdit}
          rows={4}
          placeholder="Ex: Troca de pasta termica + limpeza + repaste da CPU. Necessario trocar cabo flat do teclado (R$35)."
          className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Mão de obra (R$)
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-2 text-sm text-slate-500">R$</span>
          <input
            type="number"
            value={labor}
            onChange={(e) => setLabor(e.target.value)}
            disabled={!canEdit}
            step="0.01"
            min="0"
            className="block w-full rounded-md border border-slate-300 pl-10 pr-3 py-2 text-sm font-mono text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
          />
        </div>
      </div>
      {canEdit && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
          {saved && <span className="text-xs text-emerald-600">✓ Salvo</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      )}
    </div>
  );
}