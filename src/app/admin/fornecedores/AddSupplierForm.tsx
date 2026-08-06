'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export function AddSupplierForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: insErr } = await supabase.from('suppliers').insert({
        name: name.trim(),
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      });
      if (insErr) throw insErr;
      setName('');
      setPhone('');
      setNotes('');
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
      >
        + Novo fornecedor
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Nome do fornecedor *"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Telefone (opcional)"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
          placeholder="Observações (opcional)"
        />
      </div>
      {error && <p className="mt-2 rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {submitting ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
