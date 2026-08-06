'use client';

import { useState } from 'react';
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
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ENTRY_CHECKLIST_FIELDS.map((f) => [f.key, Boolean(initialChecklist?.[f.key])]))
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <ul className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
        {ENTRY_CHECKLIST_FIELDS.map((f) => {
          const val = checklist[f.key];
          return (
            <li key={f.key}>
              <button
                type="button"
                onClick={() => toggle(f.key)}
                disabled={!canEdit}
                className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left ${
                  canEdit ? 'hover:bg-slate-50' : 'cursor-default'
                }`}
              >
                <span className={val ? 'text-emerald-600' : 'text-red-500'}>{val ? '✓' : '✗'}</span>
                <span className="text-slate-700">{f.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {canEdit && (
        <div className="mt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar checklist'}
          </button>
          {saved && <span className="text-xs text-emerald-600">✓ Salvo</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      )}
    </div>
  );
}
