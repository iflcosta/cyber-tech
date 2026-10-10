'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { formatDateBR } from '@/app/admin/lib/datetime';

export type SpreadsheetRecord = {
  id: string;
  service_order_id: string;
  os_short_id: string;
  os_number?: string;
  customer_name?: string;
  equipment_desc?: string;
  service_description?: string;
  service_order_service_id?: string | null;
  technician_id: string;
  technician_name: string;
  labor_amount: number;
  commission_rate: number;
  commission_amount: number;
  os_status?: string;
  os_payment_status: string;
  status: 'pending' | 'paid_out';
  payout_date?: string | null;
  created_at: string;
};

export type TechProfile = {
  id: string;
  full_name: string;
  role: string;
  commission_rate?: number;
};

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

export function CommissionsSpreadsheet({
  records,
  technicians,
  currentUserId,
  currentUserName,
  isOwnerOrManager,
  iagoFixedAllowance = 100,
}: {
  records: SpreadsheetRecord[];
  technicians: TechProfile[];
  currentUserId: string;
  currentUserName: string;
  isOwnerOrManager: boolean;
  iagoFixedAllowance?: number;
}) {
  const router = useRouter();

  // Filtros internos da planilha
  const [searchTerm, setSearchTerm] = useState('');
  const [techFilter, setTechFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'paid_out' | 'all'>('pending');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal de Edição Rápida
  const [editingRecord, setEditingRecord] = useState<SpreadsheetRecord | null>(null);
  const [editLaborStr, setEditLaborStr] = useState('');
  const [editTechId, setEditTechId] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Modal de Baixa em Lote (Fechamento)
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleNotes, setSettleNotes] = useState('');
  const [settling, setSettling] = useState(false);

  // Filtragem reativa na planilha
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Permissão: técnicos comuns só veem seus próprios registros
      if (!isOwnerOrManager) {
        const isMine =
          r.technician_id === currentUserId ||
          r.technician_name.toLowerCase().includes(currentUserName.toLowerCase());
        if (!isMine) return false;
      }

      // 2. Filtro de status
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;

      // 3. Filtro de técnico
      if (techFilter !== 'all') {
        if (techFilter === 'iago' && !r.technician_name.toLowerCase().includes('iago')) return false;
        if (techFilter === 'jefferson' && !r.technician_name.toLowerCase().includes('jefferson')) return false;
        if (techFilter === 'felipe' && !r.technician_name.toLowerCase().includes('felipe')) return false;
        if (techFilter !== 'iago' && techFilter !== 'jefferson' && techFilter !== 'felipe' && r.technician_id !== techFilter) return false;
      }

      // 4. Busca textual
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchOS = (r.os_short_id || '').toLowerCase().includes(term);
        const matchCustomer = (r.customer_name || '').toLowerCase().includes(term);
        const matchEquip = (r.equipment_desc || '').toLowerCase().includes(term);
        const matchService = (r.service_description || '').toLowerCase().includes(term);
        const matchTech = (r.technician_name || '').toLowerCase().includes(term);
        if (!matchOS && !matchCustomer && !matchEquip && !matchService && !matchTech) return false;
      }

      return true;
    });
  }, [records, isOwnerOrManager, currentUserId, currentUserName, statusFilter, techFilter, searchTerm]);

  // Totais do conjunto filtrado
  const totalLabor = filteredRecords.reduce((acc, r) => acc + Number(r.labor_amount || 0), 0);
  const totalCommission = filteredRecords.reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);
  const storeRetained = Math.max(0, totalLabor - totalCommission);

  // Totais por técnico
  const iagoCommission = filteredRecords
    .filter((r) => r.technician_name.toLowerCase().includes('iago'))
    .reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);

  const jeffersonCommission = filteredRecords
    .filter((r) => r.technician_name.toLowerCase().includes('jefferson'))
    .reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);

  // Selecionar todos os visíveis
  const allVisibleSelected = filteredRecords.length > 0 && filteredRecords.every((r) => selectedIds.has(r.id));
  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Abre modal de edição rápida
  const handleOpenEdit = (rec: SpreadsheetRecord) => {
    setEditingRecord(rec);
    setEditLaborStr(rec.labor_amount > 0 ? rec.labor_amount.toFixed(2).replace('.', ',') : '');
    setEditTechId(rec.technician_id);
    setEditDesc(rec.service_description || '');
    setEditError(null);
  };

  // Salva edição rápida
  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    const laborNum = parseBRL(editLaborStr);

    setSavingEdit(true);
    setEditError(null);
    try {
      const supabase = createCRMBrowserClient();

      if (editingRecord.service_order_service_id) {
        // Atualiza item de serviço específico
        const { error: err } = await supabase
          .from('service_order_services')
          .update({
            service_name: editDesc.trim() || 'Serviço executado',
            labor_cost: laborNum,
            technician_id: editTechId || null,
          })
          .eq('id', editingRecord.service_order_service_id);
        if (err) throw err;
      } else {
        // Atualiza direto na OS para casos legados
        const { error: err } = await supabase
          .from('service_orders')
          .update({
            labor_cost: laborNum,
            technician_id: editTechId || null,
          })
          .eq('id', editingRecord.service_order_id);
        if (err) throw err;
      }

      setEditingRecord(null);
      router.refresh();
    } catch (err) {
      setEditError(`Erro ao salvar: ${(err as Error).message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Executa baixa em lote (Fechamento)
  const handleSettleBatch = async () => {
    const targetRecords = selectedIds.size > 0
      ? filteredRecords.filter((r) => selectedIds.has(r.id) && r.status === 'pending')
      : filteredRecords.filter((r) => r.status === 'pending');

    if (targetRecords.length === 0) {
      window.alert('Nenhum registro pendente selecionado para baixa.');
      return;
    }

    setSettling(true);
    try {
      const supabase = createCRMBrowserClient();
      const realLedgerIds = targetRecords.map((r) => r.id);

      // 1. Cria o lote em settlement_batches
      const totalComm = targetRecords.reduce((acc, r) => acc + Number(r.commission_amount || 0), 0);
      const { data: batch, error: batchErr } = await supabase
        .from('settlement_batches')
        .insert({
          closed_by: currentUserId,
          cycle_start: new Date(Date.now() - 7 * 86400000).toISOString(),
          cycle_end: new Date().toISOString(),
          total_commission: totalComm,
          total_allowances: iagoFixedAllowance,
          total_paid: totalComm + iagoFixedAllowance,
          notes: settleNotes.trim() || `Baixa de acerto semanal (${targetRecords.length} lançamentos)`,
        })
        .select()
        .single();

      if (batchErr) throw batchErr;

      // 2. Atualiza todos os lançamentos para 'paid_out'
      const { error: updErr } = await supabase
        .from('commission_ledger')
        .update({
          status: 'paid_out',
          payout_date: new Date().toISOString(),
          settlement_batch_id: batch.id,
        })
        .in('id', realLedgerIds);

      if (updErr) throw updErr;

      setShowSettleModal(false);
      setSelectedIds(new Set());
      router.refresh();
    } catch (err) {
      window.alert(`Erro ao fechar acerto: ${(err as Error).message}`);
    } finally {
      setSettling(false);
    }
  };

  return (
    <div className="space-y-4 font-sans">
      {/* BARRA SUPERIOR DE CONTROLE ESTILO PLANILHA */}
      <div className="border-2 border-zinc-950 bg-white p-3.5 space-y-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Status Tabs (Acerto Pendente como primeira opção!) */}
          <div className="flex items-center gap-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 font-bold uppercase transition flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              🔔 A Pagar / Pendentes
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('paid_out')}
              className={`px-3 py-1.5 font-bold uppercase transition ${
                statusFilter === 'paid_out'
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-200'
              }`}
            >
              ✓ Já Acertados
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 font-bold uppercase transition ${
                statusFilter === 'all'
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-200'
              }`}
            >
              Todos ({records.length})
            </button>
          </div>

          {/* Ações de Fechamento */}
          {isOwnerOrManager && statusFilter === 'pending' && (
            <button
              type="button"
              onClick={() => setShowSettleModal(true)}
              className="border-2 border-emerald-600 bg-emerald-600 px-3.5 py-1.5 font-mono text-xs font-black uppercase text-white hover:bg-emerald-700 transition shadow-xs flex items-center gap-1.5"
            >
              <span>💰</span> Dar Baixa no Acerto {selectedIds.size > 0 ? `(${selectedIds.size} sel.)` : '(Todos)'}
            </button>
          )}
        </div>

        {/* Linha 2: Busca rápida e Filtro por Técnico */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-200 font-mono text-xs">
          <div className="flex-1 min-w-[240px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Filtrar por OS, cliente, aparelho, serviço ou técnico..."
              className="w-full border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:bg-white focus:outline-none"
            />
          </div>

          {isOwnerOrManager && (
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500 font-bold uppercase text-[11px]">Técnico:</span>
              <button
                type="button"
                onClick={() => setTechFilter('all')}
                className={`px-2 py-1 text-xs font-bold transition ${
                  techFilter === 'all' ? 'bg-zinc-950 text-white' : 'border border-zinc-300 hover:bg-zinc-100'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setTechFilter('iago')}
                className={`px-2 py-1 text-xs font-bold transition ${
                  techFilter === 'iago' ? 'bg-zinc-950 text-white' : 'border border-zinc-300 hover:bg-zinc-100'
                }`}
              >
                Iago (30%)
              </button>
              <button
                type="button"
                onClick={() => setTechFilter('jefferson')}
                className={`px-2 py-1 text-xs font-bold transition ${
                  techFilter === 'jefferson' ? 'bg-zinc-950 text-white' : 'border border-zinc-300 hover:bg-zinc-100'
                }`}
              >
                Jefferson (50%)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* PLANILHA INTERATIVA (SPREADSHEET GRID) */}
      <div className="overflow-x-auto border-2 border-zinc-950 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-xs font-mono">
          <thead className="bg-zinc-950 text-white font-bold uppercase tracking-wider text-[11px]">
            <tr>
              <th className="px-3 py-2.5 w-8 text-center">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAll}
                  className="rounded-none cursor-pointer"
                  title="Selecionar todos os visíveis"
                />
              </th>
              <th className="px-3 py-2.5">OS #</th>
              <th className="px-3 py-2.5">Data</th>
              <th className="px-3 py-2.5">Cliente &amp; Aparelho</th>
              <th className="px-3 py-2.5">Procedimento / Serviço</th>
              <th className="px-3 py-2.5 text-right">M.O. (R$)</th>
              <th className="px-3 py-2.5">Técnico</th>
              <th className="px-3 py-2.5 text-center">% Comm</th>
              <th className="px-3 py-2.5 text-right">Comissão</th>
              <th className="px-3 py-2.5 text-center">Status OS</th>
              <th className="px-3 py-2.5 text-center">Acerto</th>
              {isOwnerOrManager && <th className="px-3 py-2.5 text-center">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={12} className="p-8 text-center text-zinc-500 font-mono">
                  Nenhum registro de comissão encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filteredRecords.map((r) => {
                const isSelected = selectedIds.has(r.id);
                const isIago = r.technician_name.toLowerCase().includes('iago');
                const isJefferson = r.technician_name.toLowerCase().includes('jefferson');

                return (
                  <tr
                    key={r.id}
                    className={`hover:bg-zinc-50 transition ${
                      isSelected ? 'bg-amber-50/70 font-semibold' : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(r.id)}
                        className="rounded-none cursor-pointer"
                      />
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <Link
                        href={`/admin/os/${r.service_order_id}`}
                        className="font-bold text-zinc-950 hover:underline underline-offset-2"
                      >
                        #{r.os_short_id}
                      </Link>
                    </td>

                    <td className="px-3 py-2 text-zinc-500 whitespace-nowrap text-[11px]">
                      {formatDateBR(r.created_at)}
                    </td>

                    <td className="px-3 py-2 max-w-[200px]">
                      <div className="font-bold text-zinc-950 truncate">{r.customer_name || 'Cliente'}</div>
                      <div className="text-[10px] text-zinc-500 truncate">{r.equipment_desc || '—'}</div>
                    </td>

                    <td className="px-3 py-2 max-w-[260px]">
                      <div className="font-semibold text-zinc-900 truncate">
                        {r.service_description || 'Mão de obra geral'}
                      </div>
                    </td>

                    <td className="px-3 py-2 text-right font-bold text-zinc-950 whitespace-nowrap">
                      {fmtBRL(r.labor_amount)}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        isIago ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' :
                        isJefferson ? 'bg-blue-100 text-blue-950 border border-blue-300' :
                        'bg-zinc-100 text-zinc-800 border border-zinc-300'
                      }`}>
                        {r.technician_name}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-center font-bold text-zinc-600 whitespace-nowrap">
                      {Math.round(r.commission_rate * 100)}%
                    </td>

                    <td className="px-3 py-2 text-right font-black text-sm text-zinc-950 whitespace-nowrap">
                      {fmtBRL(r.commission_amount)}
                    </td>

                    <td className="px-3 py-2 text-center whitespace-nowrap text-[10px]">
                      <span className={`px-1.5 py-0.5 font-bold uppercase ${
                        r.os_status === 'delivered' ? 'bg-zinc-950 text-white' :
                        r.os_status === 'ready' ? 'bg-emerald-600 text-white' :
                        'bg-zinc-200 text-zinc-800'
                      }`}>
                        {r.os_status === 'delivered' ? 'Entregue' : r.os_status === 'ready' ? 'Pronto' : 'Em Andam.'}
                      </span>
                    </td>

                    <td className="px-3 py-2 text-center whitespace-nowrap text-[10px]">
                      <span className={`px-1.5 py-0.5 font-bold uppercase ${
                        r.status === 'paid_out' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {r.status === 'paid_out' ? '✓ Baixado' : 'Pendente'}
                      </span>
                    </td>

                    {isOwnerOrManager && (
                      <td className="px-3 py-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(r)}
                          className="border border-zinc-300 bg-zinc-50 px-2 py-0.5 text-[10px] font-bold text-zinc-700 hover:bg-zinc-200"
                        >
                          Editar
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* RODAPÉ TOTALIZADOR DA PLANILHA */}
        <div className="bg-zinc-100 border-t-2 border-zinc-950 p-3 font-mono text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-zinc-600">
            <span><strong>{filteredRecords.length}</strong> itens listados</span>
            <span>M.O. Total: <strong className="text-zinc-950">{fmtBRL(totalLabor)}</strong></span>
            {isOwnerOrManager && (
              <span>Retido Loja: <strong className="text-zinc-950">{fmtBRL(storeRetained)}</strong></span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-zinc-950">
            <div>
              <span className="text-zinc-500 uppercase text-[10px] block">Comissões OS:</span>
              <strong className="text-sm">{fmtBRL(totalCommission)}</strong>
            </div>

            {/* Total Iago com Fixo */}
            {(isOwnerOrManager || currentUserName.toLowerCase().includes('iago')) && (
              <div className="border-l border-zinc-300 pl-3">
                <span className="text-emerald-800 uppercase text-[10px] font-bold block">
                  Iago (30% + R$ {iagoFixedAllowance} Fixo):
                </span>
                <strong className="text-base text-emerald-950 font-black">
                  {fmtBRL(iagoCommission + (statusFilter === 'pending' ? iagoFixedAllowance : 0))}
                </strong>
                <span className="text-[10px] text-zinc-500 block">
                  ({fmtBRL(iagoCommission)} OS + R$ {iagoFixedAllowance} Fixo Tarde)
                </span>
              </div>
            )}

            {/* Total Jefferson */}
            {(isOwnerOrManager || currentUserName.toLowerCase().includes('jefferson')) && (
              <div className="border-l border-zinc-300 pl-3">
                <span className="text-blue-800 uppercase text-[10px] font-bold block">
                  Jefferson (50%):
                </span>
                <strong className="text-base text-blue-950 font-black">
                  {fmtBRL(jeffersonCommission)}
                </strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO RÁPIDA DE LINHA */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md border-2 border-zinc-950 bg-white p-5 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="font-bold uppercase text-zinc-950 text-sm">
                Ajuste Rápido // #{editingRecord.os_short_id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRecord(null)}
                className="text-zinc-500 hover:text-black font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mt-3 border border-red-300 bg-red-50 p-2 text-red-800">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveQuickEdit} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Descrição do Procedimento:
                </label>
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                  placeholder="Ex: Desoxidação e limpeza..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Valor Mão de Obra (R$):
                  </label>
                  <input
                    type="text"
                    value={editLaborStr}
                    onChange={(e) => setEditLaborStr(e.target.value)}
                    className="w-full border border-zinc-300 bg-white p-2 text-xs font-bold focus:border-black focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Técnico Responsável:
                  </label>
                  <select
                    value={editTechId}
                    onChange={(e) => setEditTechId(e.target.value)}
                    className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                  >
                    {technicians.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setEditingRecord(null)}
                  className="border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 font-bold hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="bg-zinc-950 px-4 py-1.5 text-white font-bold uppercase hover:bg-zinc-800 disabled:opacity-50"
                >
                  {savingEdit ? 'Salvando...' : 'Salvar Alteração'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE BAIXA NO ACERTO (FECHAMENTO) */}
      {showSettleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg border-2 border-zinc-950 bg-white p-5 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="font-bold uppercase text-zinc-950 text-sm flex items-center gap-1.5">
                <span>💰</span> Fechamento &amp; Baixa no Acerto
              </h3>
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="text-zinc-500 hover:text-black font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-zinc-700">
                Confira os valores que serão marcados como <strong>QUITADOS / ACERTADOS</strong>:
              </p>

              <div className="border border-zinc-300 bg-zinc-50 p-3 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-emerald-900">Iago (Turno da Tarde):</span>
                  <span className="font-black text-sm text-emerald-950">
                    {fmtBRL(iagoCommission + iagoFixedAllowance)}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 pl-3">
                  • Comissões OS (30%): {fmtBRL(iagoCommission)}<br />
                  • Fixo Semanal Tarde: {fmtBRL(iagoFixedAllowance)}
                </div>

                <div className="flex justify-between items-center border-t border-zinc-200 pt-2">
                  <span className="font-bold text-blue-900">Jefferson (Mezanino 50%):</span>
                  <span className="font-black text-sm text-blue-950">{fmtBRL(jeffersonCommission)}</span>
                </div>

                <div className="flex justify-between items-center border-t-2 border-zinc-950 pt-2 text-sm font-black">
                  <span>TOTAL A PAGAR:</span>
                  <span>{fmtBRL(totalCommission + iagoFixedAllowance)}</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Observações do Acerto / Recibo (opcional):
                </label>
                <input
                  type="text"
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="Ex: Acerto semanal pago via PIX na sexta..."
                  className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowSettleModal(false)}
                  className="border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 font-bold hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSettleBatch}
                  disabled={settling}
                  className="bg-emerald-600 px-4 py-1.5 text-white font-bold uppercase hover:bg-emerald-700 disabled:opacity-50"
                >
                  {settling ? 'Processando Baixa...' : 'Confirmar e Quitar Acerto'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
