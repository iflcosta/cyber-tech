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
        className="border-2 border-zinc-950 bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition cursor-pointer"
      >
        + Novo fornecedor
      </button>
    );
  }

  return (
    <div className="border-2 border-zinc-950 bg-white p-4 shadow-xs">
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
          placeholder="Nome do fornecedor *"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
          placeholder="Telefone (opcional)"
        />
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="border border-zinc-300 bg-white px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
          placeholder="Observações (opcional)"
        />
      </div>
      {error && <p className="mt-2 border border-red-300 bg-red-50 p-2 font-mono text-xs font-bold text-red-700">{error}</p>}
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
        >
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={submitting}
          className="border-2 border-zinc-950 bg-zinc-950 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 transition cursor-pointer"
        >
          {submitting ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
