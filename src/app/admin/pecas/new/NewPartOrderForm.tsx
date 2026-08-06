'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { PART_VARIANT_SUGGESTIONS } from '@/app/admin/types/database';

type Supplier = { id: string; name: string; phone: string | null };
type ServiceOrderOption = { id: string; label: string; customerName: string };

function parseBRLInput(v: string): number | null {
  if (!v.trim()) return null;
  const n = Number(v.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function NewPartOrderForm({
  currentUserId,
  suppliers,
  serviceOrders,
}: {
  currentUserId: string;
  suppliers: Supplier[];
  serviceOrders: ServiceOrderOption[];
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [partDescription, setPartDescription] = useState('');
  const [partVariant, setPartVariant] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [addingSupplier, setAddingSupplier] = useState(suppliers.length === 0);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [partValue, setPartValue] = useState('');
  const [hasOS, setHasOS] = useState(serviceOrders.length > 0);
  const [serviceOrderId, setServiceOrderId] = useState('');
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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="space-y-3">
        <Field label="Peça *">
          <input
            autoFocus
            value={partDescription}
            onChange={(e) => setPartDescription(e.target.value)}
            className="form-input"
            placeholder="Ex: Tela iPhone 12"
          />
        </Field>

        <Field label="Variação (opcional)">
          <input
            list="part-variant-suggestions"
            value={partVariant}
            onChange={(e) => setPartVariant(e.target.value)}
            className="form-input"
            placeholder="Ex: OLED sem aro"
          />
          <datalist id="part-variant-suggestions">
            {PART_VARIANT_SUGGESTIONS.map((v) => (
              <option key={v} value={v} />
            ))}
          </datalist>
        </Field>

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
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                + Cadastrar novo fornecedor
              </button>
            </div>
          ) : (
            <div className="space-y-2 rounded-md border border-blue-200 bg-blue-50/40 p-2.5">
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
                  className="text-xs font-medium text-slate-600 hover:text-slate-800"
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
              className={`rounded-md border-2 px-3 py-2 text-sm font-medium transition ${
                hasOS ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              Tem OS
            </button>
            <button
              type="button"
              onClick={() => setHasOS(false)}
              className={`rounded-md border-2 px-3 py-2 text-sm font-medium transition ${
                !hasOS ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
              <p className="mt-1 text-xs text-slate-500">Nenhuma OS ativa encontrada.</p>
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

      {error && <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Salvando…' : 'Registrar pedido'}
        </button>
      </div>

      <style jsx global>{`
        .form-input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 1rem;
          line-height: 1.5;
          color: rgb(15 23 42);
          background: white;
        }
        .form-input:focus {
          outline: none;
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 1px rgb(59 130 246);
        }
        .form-input::placeholder {
          color: rgb(148 163 184);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
