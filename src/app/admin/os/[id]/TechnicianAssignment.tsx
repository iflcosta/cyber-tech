'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export interface TechProfile {
  id: string;
  full_name: string;
  commission_rate?: number;
  role?: string;
}

interface TechnicianAssignmentProps {
  osId: string;
  osShortId: string;
  currentTechnicianId: string | null;
  currentTechnicianName: string | null;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: string;
  equipmentType: string;
  reportedDefect: string;
  technicians: TechProfile[];
  canEdit: boolean;
}

export function TechnicianAssignment({
  osId,
  osShortId,
  currentTechnicianId,
  currentTechnicianName,
  currentUserId,
  currentUserName,
  currentUserRole,
  equipmentType,
  reportedDefect,
  technicians,
  canEdit,
}: TechnicianAssignmentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<string>(currentTechnicianId ?? '');
  const [isEditing, setIsEditing] = useState(false);

  const isMezaninoItem =
    equipmentType === 'celular' ||
    equipmentType === 'tablet' ||
    /gpu|placa de v[ií]deo|placa de video|reballing|rtx|gtx|radeon/i.test(reportedDefect);

  const jefferson = technicians.find((t) => t.full_name?.toLowerCase().includes('jefferson'));
  const iago = technicians.find((t) => t.full_name?.toLowerCase().includes('iago'));

  const isAssignedToMe = currentTechnicianId === currentUserId;
  const isAssignedToJefferson =
    currentTechnicianId && jefferson && currentTechnicianId === jefferson.id;
  const isAssignedToIago = currentTechnicianId && iago && currentTechnicianId === iago.id;

  async function handleAssign(targetTechId: string | null) {
    if (!canEdit) return;
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const supabase = createCRMBrowserClient();
      const targetTech = technicians.find((t) => t.id === targetTechId);
      const targetName = targetTech ? targetTech.full_name : 'Bancada Livre';

      // 1. Atualiza o technician_id na ordem de serviço
      const { error: osErr } = await supabase
        .from('service_orders')
        .update({
          technician_id: targetTechId || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', osId);

      if (osErr) throw osErr;

      // 2. Insere evento de histórico na timeline
      await supabase.from('service_order_events').insert({
        service_order_id: osId,
        event_type: 'assigned',
        from_value: currentTechnicianName ?? 'Sem técnico',
        to_value: targetName,
        note:
          targetTechId === currentUserId
            ? `${currentUserName} assumiu esta OS na bancada física.`
            : !targetTechId
            ? `${currentUserName} liberou a OS de volta para a bancada.`
            : `OS atribuída para ${targetName} por ${currentUserName}.`,
        author_id: currentUserId,
      });

      setSuccessMsg(
        targetTechId === currentUserId
          ? 'Você assumiu esta OS com sucesso!'
          : !targetTechId
          ? 'OS liberada para a bancada.'
          : `OS atribuída para ${targetName}.`,
      );
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error('Erro ao atribuir técnico:', err);
      setError((err as Error).message || 'Falha ao atribuir técnico.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            Técnico Responsável
          </span>
        </div>
        {canEdit && !isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-[11px] font-semibold text-sky-600 hover:text-sky-800 underline cursor-pointer"
          >
            {currentTechnicianId ? 'Alterar' : 'Atribuir'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-3 rounded bg-red-50 p-2 text-xs font-medium text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-3 rounded bg-emerald-50 p-2 text-xs font-medium text-emerald-800 border border-emerald-200">
          {successMsg}
        </div>
      )}

      {/* CASO 1: SEM TÉCNICO ATRIBUÍDO (OS DISPONÍVEL NA BANCADA) */}
      {!currentTechnicianId && !isEditing && (
        <div className="space-y-3 rounded-lg border-2 border-dashed border-amber-300 bg-amber-50/60 p-3.5">
          <div className="flex items-start gap-2.5">
            <span className="text-xl shrink-0">⚡</span>
            <div>
              <strong className="block text-xs font-extrabold uppercase tracking-wide text-amber-950">
                Disponível na Bancada · Sem Técnico
              </strong>
              <p className="mt-0.5 text-xs text-amber-800 leading-relaxed">
                Esta OS foi cadastrada no balcão e aguarda o técnico puxar na bancada pela etiqueta.
              </p>
            </div>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            {canEdit && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAssign(currentUserId)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-4 shadow-sm transition disabled:opacity-50 cursor-pointer"
              >
                <span>⚡ Puxar para mim (Assumir OS)</span>
              </button>
            )}

            {canEdit && isMezaninoItem && jefferson && currentUserId !== jefferson.id && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAssign(jefferson.id)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-950 font-mono text-xs font-bold uppercase py-2 px-3 transition disabled:opacity-50 cursor-pointer"
              >
                <span>🔬 Atribuir para Jefferson (Mezanino)</span>
              </button>
            )}

            {canEdit && !isMezaninoItem && iago && currentUserId !== iago.id && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleAssign(iago.id)}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-md border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 font-mono text-xs font-bold uppercase py-2 px-3 transition disabled:opacity-50 cursor-pointer"
              >
                <span>💻 Atribuir para Iago (Bancada Térreo)</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* CASO 2: TÉCNICO JÁ ATRIBUÍDO */}
      {currentTechnicianId && !isEditing && (
        <div
          className={`rounded-lg border p-3.5 space-y-2.5 ${
            isAssignedToMe
              ? 'border-emerald-300 bg-emerald-50/70 text-emerald-950'
              : isAssignedToJefferson
              ? 'border-purple-300 bg-purple-50/70 text-purple-950'
              : isAssignedToIago
              ? 'border-sky-300 bg-sky-50/70 text-sky-950'
              : 'border-slate-200 bg-slate-50 text-slate-900'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {isAssignedToJefferson ? '🔬' : isAssignedToIago ? '💻' : '👤'}
              </span>
              <div>
                <strong className="block text-sm font-bold leading-tight">
                  {currentTechnicianName ?? 'Técnico atribuído'}
                </strong>
                <span className="font-mono text-[11px] opacity-80">
                  {isAssignedToJefferson
                    ? '2º Andar // Mezanino (50% partilha)'
                    : isAssignedToIago
                    ? '1º Andar // Bancada Térreo (30% comissão)'
                    : 'Equipe de Bancada'}
                </span>
              </div>
            </div>
            {isAssignedToMe && (
              <span className="rounded bg-emerald-600 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white shrink-0">
                Sua OS
              </span>
            )}
          </div>

          {canEdit && !isAssignedToMe && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAssign(currentUserId)}
              className="w-full mt-1 inline-flex items-center justify-center gap-1.5 rounded border border-slate-900 bg-white hover:bg-slate-100 text-slate-900 font-mono text-xs font-bold uppercase py-1.5 px-3 transition disabled:opacity-50 cursor-pointer"
            >
              <span>⚡ Puxar para mim (Transferir)</span>
            </button>
          )}

          {canEdit && isAssignedToMe && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAssign(null)}
              className="w-full mt-1 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 hover:text-red-700 underline transition cursor-pointer"
            >
              <span>↩️ Devolver OS para a bancada (Desatribuir)</span>
            </button>
          )}
        </div>
      )}

      {/* FORMULÁRIO DE EDIÇÃO / SELEÇÃO MANUAL */}
      {isEditing && (
        <div className="space-y-3 rounded-lg border border-slate-300 bg-slate-50 p-3.5">
          <label className="block text-xs font-bold text-slate-700 uppercase font-mono">
            Selecione o técnico:
          </label>
          <select
            value={selectedTech}
            onChange={(e) => setSelectedTech(e.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-slate-900 focus:outline-none"
          >
            <option value="">⚡ Sem técnico atribuído (Bancada Livre)</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}{' '}
                {t.full_name?.toLowerCase().includes('jefferson')
                  ? '— Mezanino (50% partilha)'
                  : t.full_name?.toLowerCase().includes('iago')
                  ? '— Bancada Térreo (30% comissão)'
                  : t.commission_rate && t.commission_rate > 0
                  ? `(${Math.round(t.commission_rate * 100)}% comissão)`
                  : '(Margem Loja)'}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAssign(selectedTech || null)}
              className="flex-1 rounded bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Salvando…' : 'Salvar Atribuição'}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setSelectedTech(currentTechnicianId ?? '');
                setIsEditing(false);
              }}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
