'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { getChecklistFieldsForEquipment } from '@/app/admin/types/database';

export function ChecklistEditor({
  osId,
  initialChecklist,
  canEdit,
  equipmentType,
  equipmentBrand,
  equipmentModel,
}: {
  osId: string;
  initialChecklist: Record<string, boolean | string> | null | undefined;
  canEdit: boolean;
  equipmentType?: string | null;
  equipmentBrand?: string | null;
  equipmentModel?: string | null;
}) {
  const router = useRouter();
  const fields = useMemo(
    () => getChecklistFieldsForEquipment(equipmentType, equipmentBrand, equipmentModel),
    [equipmentType, equipmentBrand, equipmentModel],
  );
  const baseState = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.key, Boolean(initialChecklist?.[f.key])])),
    [fields, initialChecklist],
  );
  const [checklist, setChecklist] = useState<Record<string, boolean>>(baseState);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => fields.some((f) => Boolean(checklist[f.key]) !== Boolean(baseState[f.key])),
    [fields, checklist, baseState],
  );

  function toggle(key: string) {
    if (!canEdit) return;
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: err } = await supabase
        .from('service_orders')
        .update({ entry_checklist: checklist })
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
    <div>
      <ul className="mt-1.5 grid grid-cols-2 gap-1.5 text-xs sm:grid-cols-3">
        {fields.map((f) => {
          const val = checklist[f.key];
          return (
            <li key={f.key}>
              <button
                type="button"
                onClick={() => toggle(f.key)}
                disabled={!canEdit}
                className={`flex w-full items-center gap-2 border px-2 py-1.5 text-left font-mono text-xs transition-colors ${
                  val
                    ? 'border-2 border-zinc-950 bg-zinc-950 text-white font-bold'
                    : 'border border-zinc-300 bg-white text-zinc-600'
                } ${canEdit ? 'hover:border-zinc-950 cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`font-mono text-xs font-bold ${val ? 'text-white' : 'text-zinc-400'}`}>
                  {val ? '✓' : '—'}
                </span>
                <span>{f.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {canEdit && (isDirty || saved || error) && (
        <div className="mt-2.5 flex items-center gap-3">
          {isDirty && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
            >
              {saving ? 'Salvando...' : 'Salvar checklist'}
            </button>
          )}
          {saved && !isDirty && <span className="font-mono text-xs font-bold text-zinc-950">✓ Checklist salvo</span>}
          {error && <span className="font-mono text-xs text-red-600">{error}</span>}
        </div>
      )}
    </div>
  );
}
