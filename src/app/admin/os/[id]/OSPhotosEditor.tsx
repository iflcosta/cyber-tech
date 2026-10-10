'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { CameraSyncModal } from '../new/CameraSyncModal';

async function compressImage(file: File, maxDimension = 1600, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', quality),
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

export function OSPhotosEditor({
  osId,
  initialPhotos,
  canEdit,
}: {
  osId: string;
  initialPhotos: string[] | null | undefined;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>(
    Array.isArray(initialPhotos) ? initialPhotos.filter(Boolean) : [],
  );
  const [cameraSyncOpen, setCameraSyncOpen] = useState(false);
  const [activeSessionToken, setActiveSessionToken] = useState<string | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openCameraSync() {
    setActiveSessionToken(
      `bancada_${osId.slice(0, 8)}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    );
    setCameraSyncOpen(true);
  }

  useEffect(() => {
    setPhotos(Array.isArray(initialPhotos) ? initialPhotos.filter(Boolean) : []);
  }, [initialPhotos]);

  const persistPhotosToOS = useCallback(
    async (nextPhotos: string[]) => {
      try {
        const supabase = createCRMBrowserClient();
        const { error: upErr } = await supabase
          .from('service_orders')
          .update({
            equipment_photos: nextPhotos,
            updated_at: new Date().toISOString(),
          })
          .eq('id', osId);
        if (upErr) throw upErr;
        router.refresh();
      } catch (e) {
        setError((e as Error).message || 'Erro ao salvar fotos na OS.');
      }
    },
    [osId, router],
  );

  const handlePhotosSynced = useCallback(
    (incoming: string[]) => {
      setPhotos((prev) => {
        const merged = Array.from(new Set([...prev, ...incoming]));
        if (merged.length !== prev.length) {
          persistPhotosToOS(merged);
        }
        return merged;
      });
    },
    [persistPhotosToOS],
  );

  async function handleLocalUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const supabase = createCRMBrowserClient();
      const uploaded: string[] = [];
      for (const rawFile of Array.from(files)) {
        const file = await compressImage(rawFile);
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `sync-os-${osId.slice(0, 8)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('equipment-photos')
          .upload(path, file, { contentType: file.type || 'image/jpeg' });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from('equipment-photos').getPublicUrl(path);
        if (pub?.publicUrl) uploaded.push(pub.publicUrl);
      }
      if (uploaded.length > 0) {
        const nextPhotos = Array.from(new Set([...photos, ...uploaded]));
        setPhotos(nextPhotos);
        await persistPhotosToOS(nextPhotos);
      }
    } catch (e) {
      setError((e as Error).message || 'Erro ao enviar foto.');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemovePhoto(urlToRemove: string) {
    const nextPhotos = photos.filter((p) => p !== urlToRemove);
    setPhotos(nextPhotos);
    await persistPhotosToOS(nextPhotos);
  }

  return (
    <div id="fotos-aparelho" className="border-t-2 border-zinc-950 pt-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-950">
          📷 Fotos da Bancada &amp; Aparelho ({photos.length})
        </p>

        {canEdit && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={openCameraSync}
              className="inline-flex w-full sm:w-auto justify-center items-center gap-1.5 border-2 border-zinc-950 bg-zinc-950 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition shadow-sm text-center cursor-pointer"
            >
              <span>📱 Bipar Fotos no Celular (QR Code)</span>
            </button>

            <label className="inline-flex w-full sm:w-auto justify-center cursor-pointer items-center gap-1.5 border-2 border-zinc-950 bg-white px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition text-center">
              <span>{uploading ? 'Enviando…' : '💻 Upload do PC'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  handleLocalUpload(e.target.files);
                  e.target.value = '';
                }}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {error && <p className="mt-2 font-mono text-xs font-bold uppercase text-red-600">{error}</p>}

      {photos.length === 0 ? (
        <p className="mt-2 font-mono text-xs text-zinc-500">
          Nenhuma foto anexada ainda. Clique em <strong>📱 Bipar Fotos no Celular (QR Code)</strong> para fotografar carcaça ou placa aberta pelo celular sem cabos.
        </p>
      ) : (
        <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((url, idx) => (
            <div
              key={`${idx}-${url.slice(0, 24)}`}
              className="group relative aspect-square overflow-hidden border border-zinc-950 bg-zinc-100"
            >
              <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Foto do aparelho ${idx + 1}`}
                  className="h-full w-full object-cover hover:opacity-90"
                />
              </a>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(url)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center border border-zinc-950 bg-zinc-950 text-xs text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition"
                  title="Remover foto"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {canEdit && (
        <CameraSyncModal
          open={cameraSyncOpen}
          onClose={() => {
            setCameraSyncOpen(false);
            router.refresh();
          }}
          onPhotosSynced={handlePhotosSynced}
          existingPhotos={photos}
          osId={osId}
          sessionTokenProp={activeSessionToken}
        />
      )}
    </div>
  );
}
