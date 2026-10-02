'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export function OSDeleteButton({
  osId,
  osShortId,
  canDelete,
}: {
  osId: string;
  osShortId: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canDelete) return null;

  const confirmMatches = confirm.trim().toUpperCase() === 'APAGAR';

  async function handleDelete() {
    if (!confirmMatches) return;
    setDeleting(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      // Busca URLs de fotos antes de apagar para limpar do Storage depois
      const { data: osRow } = await supabase
        .from('service_orders')
        .select('equipment_photos')
        .eq('id', osId)
        .single();

      // Apaga a OS atomicamente (eventos e pagamentos caem via ON DELETE CASCADE)
      const { error: delErr } = await supabase
        .from('service_orders')
        .delete()
        .eq('id', osId);
      if (delErr) throw delErr;

      // Limpa fotos órfãs no bucket equipment-photos (best-effort)
      const photos: string[] = Array.isArray(osRow?.equipment_photos) ? osRow.equipment_photos : [];
      const storagePaths = photos
        .map((url) => {
          const marker = '/storage/v1/object/public/equipment-photos/';
          const idx = url.indexOf(marker);
          return idx !== -1 ? decodeURIComponent(url.slice(idx + marker.length)) : null;
        })
        .filter((p): p is string => Boolean(p));

      if (storagePaths.length > 0) {
        await supabase.storage.from('equipment-photos').remove(storagePaths);
      }

      // Redireciona pra lista
      router.push('/admin/os');
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setDeleting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border-2 border-red-500 bg-white px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 transition cursor-pointer"
      >
        🗑️ Apagar esta OS
      </button>
    );
  }

  return (
    <section className="border-2 border-red-500 bg-red-50 p-4">
      <h2 className="font-mono text-xs font-black uppercase tracking-wider text-red-900">
        ⚠️ Apagar {osShortId}?
      </h2>
      <p className="mt-2 font-mono text-xs text-red-900">
        Esta ação é <strong>irreversível</strong>. A OS, todos os eventos da timeline
        e qualquer foto associada serão apagados permanentemente.
      </p>

      <div className="mt-3">
        <label htmlFor="confirm-delete" className="block font-mono text-xs font-bold text-red-900">
          Digite <code className="border border-red-300 bg-white px-1 py-0.5 font-mono text-red-800">APAGAR</code> para confirmar:
        </label>
        <input
          id="confirm-delete"
          type="text"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="off"
          className="mt-1 w-full border-2 border-red-500 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-950 focus:outline-none"
          placeholder="APAGAR"
        />
      </div>

      {error && (
        <p className="mt-2 border border-red-300 bg-white p-2 font-mono text-xs font-bold text-red-900">{error}</p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setConfirm('');
            setError(null);
          }}
          disabled={deleting}
          className="flex-1 border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 disabled:opacity-50 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!confirmMatches || deleting}
          className="flex-1 border-2 border-red-600 bg-red-600 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition cursor-pointer"
        >
          {deleting ? 'Apagando…' : 'Apagar para sempre'}
        </button>
      </div>
    </section>
  );
}
