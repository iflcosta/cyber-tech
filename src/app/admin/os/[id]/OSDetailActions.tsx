'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

// Mudança de STATUS mora exclusivamente em StatusQuickActions — esse
// painel já teve um <select> de status livre e um campo de técnico
// atribuído, removidos numa revisão de redundâncias: o status livre
// deixava pular "Aguardando aprovação" -> "Aprovado" sem passar pelo
// modal que registra valor orçado + como o cliente aprovou; a
// atribuição de técnico nunca foi usada na prática (a loja já sabe
// informalmente quem está com qual aparelho). Sobrou só o que não
// tem duplicata em lugar nenhum: motivo de bloqueio e anotação livre
// na timeline.
export function OSDetailActions({
  osId,
  currentBlocking,
  canEdit,
  currentUserId,
  isOwner,
}: {
  osId: string;
  currentBlocking: string | null;
  canEdit: boolean;
  currentUserId: string;
  isOwner: boolean;
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

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Bloqueio e anotação</h2>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-2 w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Anotar / bloquear
        </button>
      ) : (
        <div className="mt-2 space-y-3">
          <Field label="O que trava (opcional)">
            <input value={blocking} onChange={(e) => setBlocking(e.target.value)} className="form-input" placeholder="Ex: cabo iPhone 4" />
          </Field>
          <Field label="Anotação (opcional)">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="form-input" placeholder="Aparece na timeline" />
          </Field>
          {error && <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => setOpen(false)}
              disabled={submitting}
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={submitting}
              className="flex-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
      {isOwner && (
        <p className="mt-3 text-xs text-slate-500">Você é o dono — pode editar qualquer OS.</p>
      )}
      <style jsx global>{`
        .form-input {
          width: 100%;
          border-radius: 0.375rem;
          border: 1px solid rgb(203 213 225);
          padding: 0.5rem 0.75rem;
          font-size: 0.95rem;
          color: rgb(15 23 42);
          background: white;
        }
        .form-input:focus {
          outline: none;
          border-color: rgb(59 130 246);
          box-shadow: 0 0 0 1px rgb(59 130 246);
        }
      `}</style>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
