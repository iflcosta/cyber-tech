'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export function EditCustomerForm({
  customerId,
  initialName,
  initialPhone,
  initialEmail,
  initialNotes,
}: {
  customerId: string;
  initialName: string;
  initialPhone: string;
  initialEmail: string;
  initialNotes: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: err } = await supabase
        .from('customers')
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          notes: notes.trim() || null,
        })
        .eq('id', customerId);
      if (err) throw err;
      setEditing(false);
      setSaving(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-2 space-y-1 text-sm">
        <p className="text-slate-900">{initialPhone || <span className="text-slate-400">Sem telefone</span>}</p>
        <p className="text-slate-700">{initialEmail || <span className="text-slate-400">Sem e-mail</span>}</p>
        {initialNotes && <p className="text-slate-600">{initialNotes}</p>}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700"
        >
          Editar
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-2">
      <label className="block">
        <span className="block text-xs font-medium text-slate-600">Nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>
      <label className="block">
        <span className="block text-xs font-medium text-slate-600">Telefone</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>
      <label className="block">
        <span className="block text-xs font-medium text-slate-600">E-mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>
      <label className="block">
        <span className="block text-xs font-medium text-slate-600">Observações</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-0.5 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </label>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setName(initialName);
            setPhone(initialPhone);
            setEmail(initialEmail);
            setNotes(initialNotes);
            setError(null);
          }}
          disabled={saving}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
