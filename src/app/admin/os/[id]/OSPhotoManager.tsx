'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { CameraSyncModal } from '../new/CameraSyncModal';
import { Camera, Upload, Trash2, X, Eye } from 'lucide-react';

async function compressImage(file: File, maxDimension = 1600, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
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

export function OSPhotoManager({
  osId,
  initialPhotos,
  canEdit,
}: {
  osId: string;
  initialPhotos: string[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [photos, setPhotos] = useState<string[]>(initialPhotos || []);
  const [cameraSyncOpen, setCameraSyncOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function persistPhotos(newPhotosList: string[], eventNote: string) {
    try {
      const supabase = createCRMBrowserClient();
      const { error: updateErr } = await supabase
        .from('service_orders')
        .update({ equipment_photos: newPhotosList })
        .eq('id', osId);

      if (updateErr) throw updateErr;

      // Grava evento no histórico da OS
      await supabase.from('service_order_events').insert({
        service_order_id: osId,
        event_type: 'photos_updated',
        note: eventNote,
      });

      setPhotos(newPhotosList);
      router.refresh();
    } catch (err) {
      console.error('Erro ao salvar fotos da OS:', err);
      setError((err as Error).message || 'Não foi possível atualizar as fotos.');
    }
  }

  async function handleFilesUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      const supabase = createCRMBrowserClient();
      const uploadedUrls: string[] = [];

      for (const rawFile of Array.from(files)) {
        const file = await compressImage(rawFile);
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `os-${osId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from('equipment-photos')
          .upload(path, file, { contentType: file.type || 'image/jpeg' });

        if (upErr) throw upErr;

        const { data: pub } = supabase.storage.from('equipment-photos').getPublicUrl(path);
        if (pub?.publicUrl) {
          uploadedUrls.push(pub.publicUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        const merged = Array.from(new Set([...photos, ...uploadedUrls]));
        await persistPhotos(
          merged,
          `${uploadedUrls.length} foto(s) anexada(s) à OS via upload de arquivo.`
        );
      }
    } catch (err) {
      setError((err as Error).message || 'Erro no upload das imagens.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSyncedPhotos(newPhotos: string[]) {
    if (!newPhotos || newPhotos.length === 0) return;
    const merged = Array.from(new Set([...photos, ...newPhotos]));
    await persistPhotos(
      merged,
      `${newPhotos.length} foto(s) sincronizada(s) via Cyber Camera Sync (QR Code).`
    );
  }

  async function handleRemovePhoto(photoUrl: string) {
    if (!confirm('Deseja remover esta foto da Ordem de Serviço?')) return;
    const updated = photos.filter((p) => p !== photoUrl);
    await persistPhotos(updated, 'Foto removida da vistoria da OS.');
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 font-mono">
          Vistoria Fotográfica ({photos.length})
        </p>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCameraSyncOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium font-mono transition shadow-xs cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Cyber Sync (Celular)</span>
            </button>

            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-medium font-mono transition cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{uploading ? 'Enviando...' : 'Anexar PC'}</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFilesUpload(e.target.files)}
              className="hidden"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
          {error}
        </div>
      )}

      {photos.length === 0 ? (
        <div className="border border-dashed border-slate-300 rounded-lg p-5 text-center bg-slate-50 text-slate-500 text-xs">
          <p className="mb-2 font-mono">Nenhuma foto registrada para este equipamento ainda.</p>
          {canEdit && (
            <p className="text-[11px] text-slate-400">
              Use o botão <strong>Cyber Sync (Celular)</strong> para fotografar carcaça, tela e etiqueta de série sem login, ou <strong>Anexar PC</strong> para subir do computador.
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative aspect-square overflow-hidden rounded-md border border-slate-200 bg-slate-100 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Foto de vistoria ${i + 1}`}
                className="h-full w-full object-cover transition group-hover:scale-105"
                loading="lazy"
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(url)}
                  className="p-1.5 bg-white/90 text-slate-800 rounded hover:bg-white transition cursor-pointer"
                  title="Ampliar foto"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(url)}
                    className="p-1.5 bg-red-600/90 text-white rounded hover:bg-red-600 transition cursor-pointer"
                    title="Remover foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cyber Camera Sync */}
      {cameraSyncOpen && (
        <CameraSyncModal
          open={cameraSyncOpen}
          onClose={() => setCameraSyncOpen(false)}
          onPhotosSynced={handleSyncedPhotos}
          existingPhotos={photos}
        />
      )}

      {/* Modal de Zoom */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl p-3 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-200 font-mono text-xs">
              <span className="font-bold text-slate-800">Vistoria Fotográfica · OS</span>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPhoto}
              alt="Foto ampliada"
              className="max-h-[75vh] w-auto mx-auto object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
}
