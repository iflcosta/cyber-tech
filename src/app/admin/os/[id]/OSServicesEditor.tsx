'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export type OSServiceItem = {
  id: string;
  service_name: string;
  labor_cost: number;
  technician_id: string | null;
  status: string;
  notes: string | null;
  created_at?: string;
};

export type ProfileTech = {
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

const COMMON_SERVICES = [
  'Desoxidação, banho químico e limpeza',
  'Limpeza completa e troca de pasta térmica',
  'Formatação, backup e reinstalação de sistema',
  'Reparo de circuito / placa-mãe',
  'Troca de conector de carga / solda',
  'Troca de tela / display',
  'Gravação e recuperação de BIOS',
  'Reparo secundário e testes finais',
];

export function OSServicesEditor({
  osId,
  initialServices,
  technicians,
  canEdit,
  isFinal,
  fallbackLaborCost,
  fallbackTechId,
}: {
  osId: string;
  initialServices: OSServiceItem[];
  technicians: ProfileTech[];
  canEdit: boolean;
  isFinal: boolean;
  fallbackLaborCost?: number;
  fallbackTechId?: string | null;
}) {
  const router = useRouter();
  const [services, setServices] = useState<OSServiceItem[]>(initialServices);
  const [showAddForm, setShowAddForm] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [laborCostStr, setLaborCostStr] = useState('');
  const [techId, setTechId] = useState<string>(fallbackTechId ?? technicians[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTechName = (id: string | null) => {
    if (!id) return 'Não atribuído (Loja)';
    const found = technicians.find((t) => t.id === id);
    return found ? found.full_name : 'Técnico';
  };

  const getTechRate = (id: string | null) => {
    if (!id) return 0;
    const found = technicians.find((t) => t.id === id);
    if (!found) return 0;
    const lower = found.full_name.toLowerCase();
    if (lower.includes('iago')) return 0.30;
    if (lower.includes('jefferson')) return 0.50;
    if (lower.includes('felipe')) return 0.00;
    return Number(found.commission_rate ?? 0);
  };

  const totalLabor = services.reduce((acc, s) => acc + Number(s.labor_cost || 0), 0);

  async function handleAddService(e: React.FormEvent) {
    e.preventDefault();
    const labor = parseBRL(laborCostStr);
    if (!serviceName.trim()) {
      setError('Informe a descrição do procedimento/serviço.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { data, error: err } = await supabase
        .from('service_order_services')
        .insert({
          service_order_id: osId,
          service_name: serviceName.trim(),
          labor_cost: labor,
          technician_id: techId || null,
          status: 'completed',
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (err) throw err;

      setServices((prev) => [...prev, data]);
      setServiceName('');
      setLaborCostStr('');
      setNotes('');
      setShowAddForm(false);
      router.refresh();
    } catch (err) {
      setError(`Erro ao adicionar serviço: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteService(serviceItemId: string) {
    if (!window.confirm('Remover este procedimento da Ordem de Serviço?')) return;
    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: err } = await supabase
        .from('service_order_services')
        .delete()
        .eq('id', serviceItemId);

      if (err) throw err;

      setServices((prev) => prev.filter((s) => s.id !== serviceItemId));
      router.refresh();
    } catch (err) {
      setError(`Erro ao remover serviço: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleMigrateToItemized() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const initialCost = Number(fallbackLaborCost || 0);
      const { data, error: err } = await supabase
        .from('service_order_services')
        .insert({
          service_order_id: osId,
          service_name: 'Mão de obra executada',
          labor_cost: initialCost,
          technician_id: fallbackTechId || null,
          status: 'completed',
        })
        .select()
        .single();

      if (err) throw err;
      setServices([data]);
      router.refresh();
    } catch (err) {
      setError(`Erro ao converter para procedimentos: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
        <div>
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
            <span>🛠️</span> Procedimentos &amp; Mão de Obra por Técnico
          </h3>
          <p className="text-[11px] text-zinc-500">
            Discrimine cada procedimento executado e seu respectivo técnico para rateio preciso de comissão.
          </p>
        </div>
        {canEdit && !isFinal && services.length > 0 && !showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="border border-zinc-950 bg-zinc-950 px-2.5 py-1 font-mono text-[11px] font-bold uppercase text-white hover:bg-zinc-800"
          >
            + Adicionar Procedimento
          </button>
        )}
      </div>

      {error && (
        <div className="border border-red-300 bg-red-50 p-2 font-mono text-xs text-red-800">
          {error}
        </div>
      )}

      {services.length === 0 ? (
        <div className="border border-dashed border-zinc-300 bg-zinc-50/50 p-4 text-center">
          <p className="font-mono text-xs text-zinc-600">
            Nenhum procedimento discriminado individualmente nesta OS ainda.
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">
            Mão de obra global atual: <strong>{fmtBRL(fallbackLaborCost ?? 0)}</strong> (Técnico geral:{' '}
            <strong>{getTechName(fallbackTechId ?? null)}</strong>).
          </p>
          {canEdit && !isFinal && (
            <button
              type="button"
              onClick={handleMigrateToItemized}
              disabled={saving}
              className="mt-3 border border-zinc-900 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase text-zinc-900 hover:bg-zinc-100 shadow-xs"
            >
              Discriminar Procedimentos por Técnico
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="divide-y divide-zinc-200 border border-zinc-300 bg-white">
            {services.map((item, idx) => {
              const rate = getTechRate(item.technician_id);
              const comm = Math.round(Number(item.labor_cost || 0) * rate * 100) / 100;
              const techName = getTechName(item.technician_id);

              return (
                <div
                  key={item.id}
                  className="p-3 flex flex-wrap items-center justify-between gap-2 hover:bg-zinc-50/60 transition"
                >
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-zinc-400">#{idx + 1}</span>
                      <p className="text-sm font-semibold text-zinc-950">{item.service_name}</p>
                    </div>
                    {item.notes && <p className="text-xs text-zinc-500 mt-0.5">{item.notes}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 border border-zinc-300 bg-zinc-100 px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-800">
                        👤 {techName}
                      </span>
                      {rate > 0 ? (
                        <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 font-bold">
                          {(rate * 100).toFixed(0)}% comissão ({fmtBRL(comm)})
                        </span>
                      ) : (
                        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 font-semibold">
                          100% Loja
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono text-sm font-black text-zinc-950">
                        {fmtBRL(Number(item.labor_cost || 0))}
                      </p>
                      <p className="font-mono text-[10px] text-zinc-400">Mão de obra</p>
                    </div>

                    {canEdit && !isFinal && (
                      <button
                        type="button"
                        onClick={() => handleDeleteService(item.id)}
                        disabled={saving}
                        className="text-zinc-400 hover:text-red-600 p-1 font-mono text-xs font-bold"
                        title="Remover procedimento"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between bg-zinc-100 border border-zinc-300 px-3 py-2 font-mono text-xs">
            <span className="font-bold text-zinc-700 uppercase">Total Mão de Obra ({services.length} itens):</span>
            <span className="font-black text-sm text-zinc-950">{fmtBRL(totalLabor)}</span>
          </div>
        </div>
      )}

      {showAddForm && (
        <form
          onSubmit={handleAddService}
          className="border-2 border-zinc-950 bg-zinc-50 p-3.5 space-y-3 font-mono text-xs shadow-xs"
        >
          <div className="flex items-center justify-between">
            <p className="font-bold uppercase text-zinc-950">Novo Procedimento na Bancada</p>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-zinc-500 hover:text-black font-bold"
            >
              ✕ Fechar
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
              Descrição do Serviço / Procedimento:
            </label>
            <input
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Ex: Desoxidação, banho químico e limpeza..."
              className="w-full border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-950 focus:border-black focus:outline-none"
              required
            />
            <div className="mt-1 flex flex-wrap gap-1">
              {COMMON_SERVICES.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setServiceName(s)}
                  className="text-[10px] text-zinc-600 bg-white border border-zinc-200 px-1.5 py-0.5 hover:bg-zinc-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                Valor da Mão de Obra (R$):
              </label>
              <input
                type="text"
                value={laborCostStr}
                onChange={(e) => setLaborCostStr(e.target.value)}
                placeholder="Ex: 180,00"
                className="w-full border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-950 font-bold focus:border-black focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                Técnico Executor:
              </label>
              <select
                value={techId}
                onChange={(e) => setTechId(e.target.value)}
                className="w-full border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-950 focus:border-black focus:outline-none"
              >
                {technicians.map((t) => {
                  const rate = getTechRate(t.id);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.full_name} {rate > 0 ? `(${(rate * 100).toFixed(0)}%)` : '(Loja 0%)'}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
              Observações / Laudo do Procedimento (opcional):
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Procedimento executado no turno da tarde..."
              className="w-full border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-950 focus:border-black focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="border border-zinc-300 bg-white px-3 py-1 text-xs font-bold text-zinc-700 hover:bg-zinc-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-zinc-950 px-3 py-1 text-xs font-bold uppercase text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Procedimento'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
