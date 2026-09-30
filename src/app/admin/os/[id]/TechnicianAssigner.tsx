'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export type TechnicianOption = {
  id: string;
  full_name: string;
  role?: string | null;
  commission_rate?: number | null;
};

export function TechnicianAssigner({
  osId,
  currentTechnicianId,
  currentUserId,
  currentUserName,
  technicians,
  canEdit,
}: {
  osId: string;
  currentTechnicianId: string | null;
  currentUserId: string;
  currentUserName: string;
  technicians: TechnicianOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false);

  const assignedTech = technicians.find((t) => t.id === currentTechnicianId) ?? null;
  const isAssignedToMe = Boolean(currentTechnicianId && currentTechnicianId === currentUserId);

  async function assignTo(newTechId: string | null) {
    if (newTechId === currentTechnicianId) {
      setChanging(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: upErr } = await supabase
        .from('service_orders')
        .update({ technician_id: newTechId })
        .eq('id', osId);
      if (upErr) throw upErr;

      const fromName = assignedTech?.full_name ?? 'Sem técnico';
      const toTech = technicians.find((t) => t.id === newTechId);
      const toName = toTech?.full_name ?? 'Sem técnico';

      await supabase.from('service_order_events').insert({
        service_order_id: osId,
        event_type: 'assigned',
        from_value: fromName,
        to_value: toName,
        note:
          newTechId === currentUserId
            ? `OS assumida na bancada por ${currentUserName}.`
            : newTechId
              ? `OS atribuída para ${toName} por ${currentUserName}.`
              : `Atribuição de técnico removida por ${currentUserName}.`,
        author_id: currentUserId,
      });

      setChanging(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Técnico Responsável
        </h2>
        {canEdit && !changing && (
          <button
            type="button"
            onClick={() => setChanging(true)}
            className="text-xs font-semibold text-zinc-700 underline hover:text-black cursor-pointer"
          >
            Trocar
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {assignedTech ? (
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
                isAssignedToMe
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 bg-zinc-100 text-zinc-900'
              }`}
            >
              <span>👤</span>
              <span>{assignedTech.full_name}</span>
              {isAssignedToMe && (
                <span className="rounded bg-white/20 px-1.5 py-0.2 font-mono text-[10px] uppercase">
                  Você
                </span>
              )}
            </span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
            <span>⚠️</span>
            <span>Sem técnico atribuído</span>
          </span>
        )}

        {canEdit && !isAssignedToMe && (
          <button
            type="button"
            disabled={saving}
            onClick={() => assignTo(currentUserId)}
            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
          >
            <span>🔧</span>
            <span>{saving ? 'Atribuindo…' : 'Assumir para mim'}</span>
          </button>
        )}
      </div>

      {canEdit && changing && (
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-2.5 space-y-2">
          <label className="block text-xs font-medium text-zinc-700">
            Selecionar técnico para esta OS:
          </label>
          <select
            defaultValue={currentTechnicianId ?? ''}
            disabled={saving}
            onChange={(e) => assignTo(e.target.value || null)}
            className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-950 focus:border-black focus:outline-none"
          >
            <option value="">— Sem técnico (Fila geral) —</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name} {t.id === currentUserId ? '(Você)' : ''}
              </option>
            ))}
          </select>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setChanging(false)}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
