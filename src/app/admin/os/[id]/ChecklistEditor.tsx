'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { ENTRY_CHECKLIST_FIELDS } from '@/app/admin/types/database';

export function ChecklistEditor({
  osId,
  initialChecklist,
  canEdit,
}: {
  osId: string;
  initialChecklist: Record<string, boolean | string> | null | undefined;
  canEdit: boolean;
}) {
  const router = useRouter();
  const baseState = useMemo(
    () => Object.fromEntries(ENTRY_CHECKLIST_FIELDS.map((f) => [f.key, Boolean(initialChecklist?.[f.key])])),
    [initialChecklist],
  );
  const [checklist, setChecklist] = useState<Record<string, boolean>>(baseState);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = useMemo(
    () => ENTRY_CHECKLIST_FIELDS.some((f) => Boolean(checklist[f.key]) !== Boolean(baseState[f.key])),
    [checklist, baseState],
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
        {ENTRY_CHECKLIST_FIELDS.map((f) => {
          const val = checklist[f.key];
          return (
            <li key={f.key}>
              <button
                type="button"
                onClick={() => toggle(f.key)}
                disabled={!canEdit}
                className={`flex w-full items-center gap-2 rounded-md border px-2 py-1.5 text-left transition-colors ${
                  val
                    ? 'border-zinc-300 bg-zinc-50 text-zinc-950 font-medium'
                    : 'border-zinc-200 bg-white text-zinc-500'
                } ${canEdit ? 'hover:border-zinc-400 cursor-pointer' : 'cursor-default'}`}
              >
                <span className={`font-mono text-xs font-bold ${val ? 'text-black' : 'text-zinc-400'}`}>
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
              className="rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar checklist'}
            </button>
          )}
          {saved && !isDirty && <span className="text-xs font-medium text-zinc-900">✓ Checklist salvo</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      )}
    </div>
  );
}
