'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/crm/lib/supabase/client';

export function OSPhotoUpload({ osId, currentPhotoUrl }: { osId: string; currentPhotoUrl: string | null }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentPhotoUrl);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);

    // Preview local antes do upload
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const supabase = createCRMBrowserClient();
      // Nome do arquivo: <osId>-<timestamp>.<ext> (sem PII no path)
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${osId}/${Date.now()}.${ext}`;

      const { error: uploadErr } = await supabase.storage
        .from('os-photos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });
      if (uploadErr) throw uploadErr;

      const { data: { publicUrl } } = supabase.storage
        .from('os-photos')
        .getPublicUrl(path);

      // Salvar URL no service_order
      const { error: updateErr } = await supabase
        .from('service_orders')
        .update({ photo_url: publicUrl })
        .eq('id', osId);
      if (updateErr) throw updateErr;

      // Insere evento na timeline
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        await supabase.from('service_order_events').insert({
          service_order_id: osId,
          event_type: 'checklist_updated',
          note: `Foto do aparelho atualizada por ${profile?.full_name ?? 'alguém'}`,
          author_id: user.id,
        });
      }

      setPreview(publicUrl);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setPreview(currentPhotoUrl);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemove() {
    if (!confirm('Remover a foto do aparelho?')) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const { error: updateErr } = await supabase
        .from('service_orders')
        .update({ photo_url: null })
        .eq('id', osId);
      if (updateErr) throw updateErr;
      setPreview(null);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Foto do aparelho</h2>

      {preview ? (
        <div className="mt-2 space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Foto do aparelho"
            className="w-full rounded-md border border-slate-200 object-cover"
            style={{ maxHeight: '300px' }}
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            🗑️ Remover foto
          </button>
        </div>
      ) : (
        <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center hover:border-blue-400 hover:bg-blue-50">
          <span className="text-3xl">📷</span>
          <span className="mt-2 text-sm font-medium text-slate-700">
            {uploading ? 'Enviando…' : 'Toque para tirar foto'}
          </span>
          <span className="mt-1 text-xs text-slate-500">JPG, PNG ou WebP até 5MB</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}

      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </section>
  );
}
