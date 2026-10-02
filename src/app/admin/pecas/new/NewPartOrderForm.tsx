'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { PART_FRAME_OPTIONS, PART_FINISH_OPTIONS } from '@/app/admin/types/database';

type Supplier = { id: string; name: string; phone: string | null };
type ServiceOrderOption = { id: string; label: string; customerName: string };

function parseBRLInput(v: string): number | null {
  const clean = v.trim().replace(/[R$\s]/g, '');
  if (!clean) return null;
  const normalized = clean.includes(',')
    ? clean.replace(/\./g, '').replace(',', '.')
    : clean;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function NewPartOrderForm({
  currentUserId,
  suppliers,
  serviceOrders,
  initialServiceOrderId,
}: {
  currentUserId: string;
  suppliers: Supplier[];
  serviceOrders: ServiceOrderOption[];
  initialServiceOrderId?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [partDescription, setPartDescription] = useState('');
  const [frame, setFrame] = useState<string | null>(null);
  const [finish, setFinish] = useState<string | null>(null);
  const [customVariant, setCustomVariant] = useState('');
  const partVariant = [frame, finish, customVariant.trim() || null].filter(Boolean).join(' · ');
  const [supplierId, setSupplierId] = useState('');
  const [addingSupplier, setAddingSupplier] = useState(suppliers.length === 0);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [partValue, setPartValue] = useState('');
  const [hasOS, setHasOS] = useState(Boolean(initialServiceOrderId) || serviceOrders.length > 0);
  const [serviceOrderId, setServiceOrderId] = useState(initialServiceOrderId ?? '');
  const [contextNote, setContextNote] = useState('');

  async function submit() {
    if (!partDescription.trim()) {
      setError('Descrição da peça é obrigatória.');
      return;
    }
    if (!addingSupplier && !supplierId) {
      setError('Selecione um fornecedor ou cadastre um novo.');
      return;
    }
    if (addingSupplier && !newSupplierName.trim()) {
      setError('Nome do fornecedor é obrigatório.');
      return;
    }
    const value = parseBRLInput(partValue);
    if (value === null || value < 0) {
      setError('Valor da peça é obrigatório.');
      return;
    }
    if (hasOS && !serviceOrderId) {
      setError('Selecione a OS ou marque "Sem OS" e descreva o contexto.');
      return;
    }
    if (!hasOS && !contextNote.trim()) {
      setError('Sem OS vinculada, descreva o contexto (ex: "Loja TechFix — cliente Marcos").');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();

      let finalSupplierId = supplierId;
      if (addingSupplier) {
        const { data: newSupplier, error: supErr } = await supabase
          .from('suppliers')
          .insert({
            name: newSupplierName.trim(),
            phone: newSupplierPhone.trim() || null,
          })
          .select('id')
          .single();
        if (supErr) throw supErr;
        finalSupplierId = newSupplier.id;
      }

      const { data: newOrder, error: poErr } = await supabase
        .from('part_orders')
        .insert({
          part_description: partDescription.trim(),
          part_variant: partVariant.trim() || null,
          supplier_id: finalSupplierId,
          part_value: value,
          service_order_id: hasOS ? serviceOrderId : null,
          context_note: hasOS ? null : contextNote.trim(),
          status: 'ordered',
          requested_by: currentUserId,
        })
        .select('id')
        .single();
      if (poErr) throw poErr;

      await supabase.from('part_order_events').insert({
        part_order_id: newOrder.id,
        event_type: 'created',
        to_value: 'ordered',
        author_id: currentUserId,
      });

      router.push(`/admin/pecas/${newOrder.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="border-2 border-zinc-950 bg-white p-4 sm:p-6">
      <div className="space-y-4">
        <Field label="Peça *">
          <input
            autoFocus
            value={partDescription}
            onChange={(e) => setPartDescription(e.target.value)}
            className="form-input"
            placeholder="Ex: Tela iPhone 12"
          />
        </Field>

        <Field label="Aro (se aplicável)">
          <div className="flex flex-wrap gap-2">
            {PART_FRAME_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFrame(frame === opt ? null : opt)}
                className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                  frame === opt
                    ? 'border-2 border-zinc-950 bg-zinc-950 text-white font-bold'
                    : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 font-medium'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Acabamento / tecnologia (se aplicável)">
          <div className="flex flex-wrap gap-2">
            {PART_FINISH_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setFinish(finish === opt ? null : opt)}
                className={`px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                  finish === opt
                    ? 'border-2 border-zinc-950 bg-zinc-950 text-white font-bold'
                    : 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 font-medium'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Outro detalhe (opcional)">
          <input
            value={customVariant}
            onChange={(e) => setCustomVariant(e.target.value)}
            className="form-input"
            placeholder="Ex: cor, capacidade, fornecedor específico…"
          />
        </Field>

        {partVariant && (
          <p className="font-mono text-xs text-zinc-500">
            Variação final: <strong className="text-zinc-950">{partVariant}</strong>
          </p>
        )}

        <Field label="Fornecedor *">
          {!addingSupplier ? (
            <div className="space-y-1.5">
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} className="form-input">
                <option value="">— Selecione —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setAddingSupplier(true)}
                className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 underline hover:text-zinc-700 cursor-pointer"
              >
                + Cadastrar novo fornecedor
              </button>
            </div>
          ) : (
            <div className="space-y-2 border border-zinc-300 bg-zinc-50 p-3">
              <input
                value={newSupplierName}
                onChange={(e) => setNewSupplierName(e.target.value)}
                className="form-input"
                placeholder="Nome do fornecedor"
              />
              <input
                value={newSupplierPhone}
                onChange={(e) => setNewSupplierPhone(e.target.value)}
                className="form-input"
                placeholder="Telefone (opcional)"
              />
              {suppliers.length > 0 && (
                <button
                  type="button"
                  onClick={() => setAddingSupplier(false)}
                  className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-600 underline hover:text-zinc-950 cursor-pointer"
                >
                  ← Usar fornecedor já cadastrado
                </button>
              )}
            </div>
          )}
        </Field>

        <Field label="Valor da peça *">
          <input
            value={partValue}
            onChange={(e) => setPartValue(e.target.value)}
            className="form-input"
            placeholder="0,00"
            inputMode="decimal"
          />
        </Field>

        <Field label="Vínculo">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setHasOS(true)}
              className={`border-2 p-2.5 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                hasOS ? 'border-zinc-950 bg-zinc-950 text-white font-bold' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Tem OS
            </button>
            <button
              type="button"
              onClick={() => setHasOS(false)}
              className={`border-2 p-2.5 font-mono text-xs uppercase tracking-wider transition cursor-pointer ${
                !hasOS ? 'border-zinc-950 bg-zinc-950 text-white font-bold' : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Sem OS (lojista parceiro, etc)
            </button>
          </div>
        </Field>

        {hasOS ? (
          <Field label="OS *">
            <select value={serviceOrderId} onChange={(e) => setServiceOrderId(e.target.value)} className="form-input">
              <option value="">— Selecione a OS —</option>
              {serviceOrders.map((o) => (
                <option key={o.id} value={o.id}>{o.label} · {o.customerName}</option>
              ))}
            </select>
            {serviceOrders.length === 0 && (
              <p className="mt-1 font-mono text-xs text-zinc-500">Nenhuma OS ativa encontrada.</p>
            )}
          </Field>
        ) : (
          <Field label="Contexto *">
            <input
              value={contextNote}
              onChange={(e) => setContextNote(e.target.value)}
              className="form-input"
              placeholder='Ex: "Loja TechFix — cliente Marcos"'
            />
          </Field>
        )}
      </div>

      {error && <p className="mt-3 border border-red-300 bg-red-50 p-2 font-mono text-xs font-bold text-red-700">{error}</p>}

      <div className="mt-6 flex justify-end gap-2 border-t-2 border-zinc-200 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="border-2 border-zinc-950 bg-white px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="border-2 border-zinc-950 bg-zinc-950 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
        >
          {submitting ? 'Salvando…' : 'Registrar pedido'}
        </button>
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          border: 1px solid #d4d4d8;
          padding: 0.55rem 0.85rem;
          font-size: 0.9rem;
          font-family: inherit;
          line-height: 1.5;
          color: #09090b;
          background: white;
        }
        .form-input:focus {
          outline: none;
          border-color: #09090b;
        }
        .form-input::placeholder {
          color: #a1a1aa;
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block font-mono text-xs font-bold uppercase tracking-wider text-zinc-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
