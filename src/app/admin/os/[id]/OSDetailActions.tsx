'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

/**
 * Ações rápidas de anotação livre na timeline e registro/remoção de
 * motivo de bloqueio ("Travado em"). Integrado diretamente no cabeçalho
 * da seção de Linha do Tempo para evitar caixas soltas na barra lateral.
 */
export function OSDetailActions({
  osId,
  currentBlocking,
  canEdit,
  currentUserId,
}: {
  osId: string;
  currentBlocking: string | null;
  canEdit: boolean;
  currentUserId: string;
  isOwner?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [blocking, setBlocking] = useState<string>(currentBlocking ?? '');
  const [note, setNote] = useState<string>('');

  if (!canEdit) return null;

  async function save() {
    setSubmitting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();

      if (blocking !== (currentBlocking ?? '')) {
        const { error: upErr } = await supabase
          .from('service_orders')
          .update({ blocking_reason: blocking || null })
          .eq('id', osId);
        if (upErr) throw upErr;

        await supabase.from('service_order_events').insert({
          service_order_id: osId,
          event_type: blocking ? 'note_added' : 'part_resolved',
          note: blocking ? `Bloqueio: ${blocking}` : 'Bloqueio resolvido',
          author_id: currentUserId,
        });
      }
      if (note.trim()) {
        await supabase.from('service_order_events').insert({
          service_order_id: osId,
          event_type: 'note_added',
          note: note.trim(),
          author_id: currentUserId,
        });
      }

      setOpen(false);
      setNote('');
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
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors"
      >
        + Anotar / Bloquear
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-md border border-zinc-200 bg-zinc-50 p-3 space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Motivo de bloqueio (deixe vazio p/ limpar)">
          <input
            value={blocking}
            onChange={(e) => setBlocking(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Ex: aguardando conector chegar"
          />
        </Field>
        <Field label="Nova anotação na linha do tempo">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
            placeholder="Ex: Cliente ligou pedindo urgência"
          />
        </Field>
      </div>
      {error && <p className="rounded-md bg-red-50 p-2 text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={submitting}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={submitting}
          className="rounded-md bg-black px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {submitting ? 'Salvando…' : 'Salvar registro'}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-zinc-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
