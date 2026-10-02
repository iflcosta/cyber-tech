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
      <div className="mt-2 space-y-1 font-mono text-xs">
        <p className="text-zinc-950">{initialPhone || <span className="text-zinc-400">Sem telefone</span>}</p>
        <p className="text-zinc-700">{initialEmail || <span className="text-zinc-400">Sem e-mail</span>}</p>
        {initialNotes && <p className="text-zinc-600">{initialNotes}</p>}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 underline hover:text-zinc-700 cursor-pointer"
        >
          Editar dados
        </button>
      </div>
    );
  }

  return (
    <div className="mt-2 space-y-3">
      <label className="block">
        <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">Nome</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">Telefone</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">E-mail</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
        />
      </label>
      <label className="block">
        <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">Observações</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
        />
      </label>
      {error && <p className="font-mono text-xs font-bold text-red-600">{error}</p>}
      <div className="flex gap-2 pt-1">
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
          className="border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 disabled:opacity-30 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="bg-zinc-950 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
        >
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>
    </div>
  );
}
