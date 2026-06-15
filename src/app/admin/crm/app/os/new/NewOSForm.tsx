'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '../../../../lib/supabase/client';
import { EQUIPMENT_TYPES, ENTRY_CHECKLIST_FIELDS, type EquipmentTypeValue } from '../../../../types/database';

type Profile = { id: string; full_name: string };

export function NewOSForm({
  currentUserId,
  technicians,
  owners,
}: {
  currentUserId: string;
  technicians: Profile[];
  owners: Profile[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [equipment, setEquipment] = useState({
    type: 'notebook' as EquipmentTypeValue,
    brand: '',
    model: '',
    color: '',
    serial: '',
    password: '',
  });
  const [checklist, setChecklist] = useState<Record<string, boolean>>(
    Object.fromEntries(ENTRY_CHECKLIST_FIELDS.map((f) => [f.key, false])),
  );
  const [accessories, setAccessories] = useState('');
  const [defect, setDefect] = useState('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [blocking, setBlocking] = useState('');
  const [estimatedReady, setEstimatedReady] = useState('');

  function next() {
    if (step === 1 && !customer.name.trim()) {
      setError('Nome do cliente é obrigatório.');
      return;
    }
    if (step === 2 && !equipment.model.trim() && equipment.type !== 'outro') {
      setError('Modelo do aparelho é obrigatório.');
      return;
    }
    setError(null);
    setStep((s) => Math.min(3, s + 1));
  }

  async function submit() {
    if (!defect.trim()) {
      setError('Defeito relatado é obrigatório.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      // 1. cliente
      const { data: newCustomer, error: custErr } = await supabase
        .from('customers')
        .insert({
          name: customer.name.trim(),
          phone: customer.phone.trim() || null,
          email: customer.email.trim() || null,
        })
        .select('id')
        .single();
      if (custErr) throw custErr;

      // 2. OS
      const { data: newOS, error: osErr } = await supabase
        .from('service_orders')
        .insert({
          customer_id: newCustomer.id,
          equipment_type: equipment.type,
          equipment_brand: equipment.brand.trim() || null,
          equipment_model: equipment.model.trim() || null,
          equipment_color: equipment.color.trim() || null,
          equipment_serial: equipment.serial.trim() || null,
          equipment_password: equipment.password.trim() || null,
          reported_defect: defect.trim(),
          entry_checklist: checklist,
          accessories_in: accessories.trim() || null,
          assigned_to: assignedTo || null,
          blocking_reason: blocking.trim() || null,
          estimated_ready_at: estimatedReady || null,
          created_by: currentUserId,
        })
        .select('id, os_number')
        .single();
      if (osErr) throw osErr;

      // 3. evento inicial
      await supabase.from('service_order_events').insert({
        service_order_id: newOS.id,
        event_type: 'created',
        to_value: 'awaiting_approval',
        author_id: currentUserId,
        note: assignedTo ? `Atribuída a ${technicians.concat(owners).find((p) => p.id === assignedTo)?.full_name ?? '—'}` : null,
      });

      router.push(`/admin/os/${newOS.id}`);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold ${
                n <= step ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'
              }`}
            >
              {n}
            </div>
            <div className={`text-sm font-medium ${n === step ? 'text-slate-900' : 'text-slate-400'}`}>
              {n === 1 ? 'Cliente' : n === 2 ? 'Aparelho' : 'Serviço'}
            </div>
            {n < 3 && <div className="h-px flex-1 bg-slate-200" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <Field label="Nome do cliente *">
            <input
              autoFocus
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              className="form-input"
              placeholder="Ex: Maria Silva"
            />
          </Field>
          <Field label="Telefone">
            <input
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              className="form-input"
              placeholder="(11) 99999-9999"
            />
          </Field>
          <Field label="E-mail (opcional)">
            <input
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              className="form-input"
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <Field label="Tipo de aparelho *">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {EQUIPMENT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setEquipment({ ...equipment, type: t.value })}
                  className={`rounded-md border-2 px-3 py-2 text-sm font-medium transition ${
                    equipment.type === t.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Marca">
              <input value={equipment.brand} onChange={(e) => setEquipment({ ...equipment, brand: e.target.value })} className="form-input" placeholder="Ex: Samsung" />
            </Field>
            <Field label="Modelo *">
              <input value={equipment.model} onChange={(e) => setEquipment({ ...equipment, model: e.target.value })} className="form-input" placeholder="Ex: Galaxy S21" />
            </Field>
            <Field label="Cor">
              <input value={equipment.color} onChange={(e) => setEquipment({ ...equipment, color: e.target.value })} className="form-input" placeholder="Preto" />
            </Field>
            <Field label="IMEI / Serial">
              <input value={equipment.serial} onChange={(e) => setEquipment({ ...equipment, serial: e.target.value })} className="form-input" />
            </Field>
          </div>
          <Field label="Senha / padrão (se souber)">
            <input
              type="text"
              value={equipment.password}
              onChange={(e) => setEquipment({ ...equipment, password: e.target.value })}
              className="form-input"
              placeholder="Para teste do aparelho"
            />
          </Field>
          <Field label="Checklist de entrada">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {ENTRY_CHECKLIST_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checklist[f.key] ?? false}
                    onChange={(e) => setChecklist({ ...checklist, [f.key]: e.target.checked })}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </Field>
          <Field label="Acessórios que entraram">
            <input value={accessories} onChange={(e) => setAccessories(e.target.value)} className="form-input" placeholder="Ex: carregador + capa" />
          </Field>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <Field label="Defeito relatado pelo cliente *">
            <textarea
              autoFocus
              value={defect}
              onChange={(e) => setDefect(e.target.value)}
              rows={3}
              className="form-input"
              placeholder="Ex: tela trincada após queda, não carrega"
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Atribuir a (opcional)">
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="form-input"
              >
                <option value="">— Deixar pra alguém pegar —</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} (técnico)
                  </option>
                ))}
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.full_name} (dono)
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Previsão (opcional)">
              <input
                type="date"
                value={estimatedReady}
                onChange={(e) => setEstimatedReady(e.target.value)}
                className="form-input"
              />
            </Field>
          </div>
          <Field label="Já trava em algo? (opcional)">
            <input
              value={blocking}
              onChange={(e) => setBlocking(e.target.value)}
              className="form-input"
              placeholder="Ex: aguardando cabo iPhone 4"
            />
          </Field>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-5 flex justify-between gap-2">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || submitting}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          Voltar
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={next}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Próximo →
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Salvando…' : 'Criar OS'}
          </button>
        )}
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
