'use client';

import { useState, useEffect, use } from 'react';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

const GUIDED_SLOTS = [
  {
    id: 'front',
    title: '1. Frente / Tela',
    subtitle: 'Mostre a tela ou painel frontal do equipamento',
    icon: '📱',
  },
  {
    id: 'back',
    title: '2. Traseira / Etiqueta S/N',
    subtitle: 'Mostre a tampa traseira, lacres ou etiqueta de série',
    icon: '🏷️',
  },
  {
    id: 'sides',
    title: '3. Laterais / Conectores / Avarias',
    subtitle: 'Registre portas USB/HDMI, dobradiças ou riscos prévios',
    icon: '🔍',
  },
  {
    id: 'board',
    title: '4. Bancada / Placa Aberta / Oxidação',
    subtitle: 'Registre placa-mãe, circuito interno, oxidação ou componentes',
    icon: '🔬',
  },
] as const;

async function loadDrawableImage(
  file: File,
): Promise<{ source: CanvasImageSource; width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);
      return { source: bitmap, width: bitmap.width, height: bitmap.height };
    } catch {
      // Fallback para HTMLImageElement em navegadores mobile que falham no createImageBitmap
    }
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        source: img,
        width: img.naturalWidth || img.width,
        height: img.naturalHeight || img.height,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível decodificar a imagem selecionada.'));
    };
    img.src = url;
  });
}

async function compressToBlobAndDataUrl(
  file: File,
  maxDimension = 1280,
  quality = 0.78,
): Promise<{ file: File; dataUrl: string }> {
  const { source, width: rawW, height: rawH } = await loadDrawableImage(file);
  const scale = Math.min(1, maxDimension / Math.max(rawW, rawH));
  const width = Math.max(1, Math.round(rawW * scale));
  const height = Math.max(1, Math.round(rawH * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');
  ctx.drawImage(source, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  const compressedFile = blob
    ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' })
    : file;

  return { file: compressedFile, dataUrl };
}

export default function MobileCameraSyncPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);
  const [status, setStatus] = useState<'active' | 'completed' | 'expired'>('active');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInitial() {
      try {
        const res = await fetch(`/api/camera-sync?token=${encodeURIComponent(token)}`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.photos)) setPhotos(data.photos);
          if (data.status) setStatus(data.status);
        }
      } catch {
        // Ignora erro de rede inicial
      }
    }
    fetchInitial();
  }, [token]);

  async function handleCapture(files: FileList | null, slotLabel: string) {
    if (!files || files.length === 0) return;
    setUploadingSlot(slotLabel);
    setError(null);
    setFeedback(null);

    try {
      const supabase = (() => {
        try {
          return createCRMBrowserClient();
        } catch {
          return null;
        }
      })();

      const safeToken = token.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32);

      for (const rawFile of Array.from(files)) {
        const { file, dataUrl } = await compressToBlobAndDataUrl(rawFile, 1280, 0.78);
        let finalUrl = dataUrl;

        // 1. Sobe para o bucket público equipment-photos (permitido pela policy 'sync-%')
        if (supabase) {
          try {
            const path = `sync-${safeToken}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
            const { error: upErr } = await supabase.storage
              .from('equipment-photos')
              .upload(path, file, { contentType: 'image/jpeg', upsert: false });
            if (!upErr) {
              const { data: pub } = supabase.storage.from('equipment-photos').getPublicUrl(path);
              if (pub?.publicUrl) finalUrl = pub.publicUrl;
            }
          } catch {
            // Se falhar no client, o servidor (/api/camera-sync) converte o dataUrl em arquivo no bucket
          }
        }

        // 2. Sincroniza via API (que persiste em public.camera_sync_sessions e na OS se vinculada)
        let syncedUrl = finalUrl;
        const res = await fetch('/api/camera-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store',
          body: JSON.stringify({
            token,
            action: 'add_photo',
            photoUrl: finalUrl,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          if (Array.isArray(updated.photos) && updated.photos.length > 0) {
            setPhotos(updated.photos);
            syncedUrl = updated.photos[updated.photos.length - 1] || finalUrl;
          } else {
            setPhotos((prev) => [...prev, finalUrl]);
          }
        } else {
          setPhotos((prev) => [...prev, finalUrl]);
        }

        // 3. Dispara broadcast via Supabase Realtime se disponível
        if (supabase) {
          try {
            const channel = supabase.channel(`camera-sync:${token}`);
            channel.subscribe((subStatus) => {
              if (subStatus === 'SUBSCRIBED') {
                channel
                  .send({
                    type: 'broadcast',
                    event: 'photo_added',
                    payload: { photoUrl: syncedUrl, slot: slotLabel },
                  })
                  .finally(() => {
                    setTimeout(() => {
                      supabase.removeChannel(channel);
                    }, 1500);
                  });
              }
            });
          } catch {
            // Ignora falha de broadcast se API já salvou no banco
          }
        }
      }

      setFeedback(`✓ Foto (${slotLabel}) enviada ao PC do Balcão!`);
    } catch (err) {
      setError((err as Error).message || 'Não foi possível enviar a foto.');
    } finally {
      setUploadingSlot(null);
    }
  }

  async function finishSession() {
    try {
      await fetch('/api/camera-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, action: 'complete' }),
      });
      setStatus('completed');
    } catch {
      setStatus('completed');
    }
  }

  if (status === 'completed') {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-5 text-center text-zinc-950">
        <div className="w-full max-w-sm border-2 border-zinc-950 bg-white p-6 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center border-2 border-zinc-950 bg-zinc-100 text-2xl font-mono">
            ✓
          </div>
          <h1 className="mt-4 text-xl font-black uppercase tracking-tight text-zinc-950">
            Fotos Sincronizadas no Balcão!
          </h1>
          <p className="mt-2 text-xs font-mono text-zinc-600">
            <strong className="text-zinc-950">{photos.length}</strong> {photos.length === 1 ? 'foto foi anexada' : 'fotos foram anexadas'} diretamente à Ordem de Serviço no computador do balcão.
          </p>
          <p className="mt-4 border border-zinc-300 bg-zinc-50 p-3 font-mono text-xs text-zinc-600">
            Você já pode guardar o celular no bolso e concluir a impressão da etiqueta 58mm no PC.
          </p>
          <button
            type="button"
            onClick={() => setStatus('active')}
            className="mt-5 w-full border-2 border-zinc-950 bg-white px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
          >
            + Tirar mais fotos nesta sessão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50 pb-12 text-zinc-950">
      {/* Header Mobile CIS-01 */}
      <header className="sticky top-0 z-10 border-b-2 border-zinc-950 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 bg-emerald-500 animate-pulse" />
            <span className="font-mono text-sm font-black uppercase tracking-tight text-zinc-950">
              Cyber Camera Sync
            </span>
          </div>
          <span className="border border-zinc-950 bg-zinc-950 px-2 py-0.5 font-mono text-[11px] font-bold uppercase text-white">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-4">
        <div className="border-2 border-zinc-950 bg-white p-4 shadow-sm">
          <h1 className="font-black uppercase tracking-tight text-zinc-950">
            Vistoria Fotográfica de Check-in
          </h1>
          <p className="mt-1 text-xs font-mono text-zinc-600">
            Toque em cada ângulo abaixo para abrir a câmera traseira. As fotos aparecem em tempo real na tela do PC.
          </p>
        </div>

        {feedback && (
          <div className="border-2 border-emerald-600 bg-emerald-50 p-3 font-mono text-xs font-bold uppercase text-emerald-800">
            {feedback}
          </div>
        )}

        {error && (
          <div className="border-2 border-red-600 bg-red-50 p-3 font-mono text-xs font-bold uppercase text-red-700">
            {error}
          </div>
        )}

        {/* 3 Slots Guiados de Captura Rápida */}
        <div className="space-y-2.5">
          {GUIDED_SLOTS.map((slot, index) => {
            const isUploading = uploadingSlot === slot.title;
            const hasPhotoForSlot = photos.length > index;

            return (
              <label
                key={slot.id}
                className={`flex cursor-pointer items-center justify-between gap-3 border-2 p-4 transition ${
                  hasPhotoForSlot
                    ? 'border-emerald-600 bg-emerald-50/50'
                    : 'border-zinc-950 bg-white hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center border text-xl ${
                      hasPhotoForSlot
                        ? 'border-emerald-600 bg-emerald-100 text-emerald-800'
                        : 'border-zinc-950 bg-zinc-100 text-zinc-950'
                    }`}
                  >
                    {hasPhotoForSlot ? '✓' : slot.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold uppercase tracking-tight text-zinc-950">{slot.title}</div>
                    <div className="text-xs font-mono text-zinc-600">{slot.subtitle}</div>
                  </div>
                </div>

                <span
                  className={`shrink-0 border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider ${
                    isUploading
                      ? 'border-amber-400 bg-amber-100 text-amber-900'
                      : hasPhotoForSlot
                        ? 'border-emerald-600 bg-white text-emerald-800'
                        : 'border-zinc-950 bg-zinc-950 text-white'
                  }`}
                >
                  {isUploading ? 'Enviando…' : hasPhotoForSlot ? '+ Outra' : '📷 Fotografar'}
                </span>

                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleCapture(e.target.files, slot.title)}
                  disabled={uploadingSlot !== null}
                  className="hidden"
                />
              </label>
            );
          })}
        </div>

        {/* Botão de Fotos Extras */}
        <label className="flex cursor-pointer items-center justify-center gap-2 border-2 border-dashed border-zinc-950 bg-white p-3.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition">
          <span>➕ Adicionar foto extra / detalhe de avaria</span>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => handleCapture(e.target.files, 'Detalhe Extra')}
            disabled={uploadingSlot !== null}
            className="hidden"
          />
        </label>

        {/* Miniaturas já sincronizadas */}
        {photos.length > 0 && (
          <div className="border-2 border-zinc-950 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between border-b border-zinc-200 pb-2">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-700">
                Fotos no PC do Balcão ({photos.length})
              </span>
              <span className="font-mono text-[11px] font-bold uppercase text-emerald-700">
                Sincronizado ✓
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, idx) => (
                <div
                  key={`${idx}-${url.slice(0, 24)}`}
                  className="relative aspect-square overflow-hidden border border-zinc-950 bg-zinc-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 bg-zinc-950/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                    #{idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Botão Finalizar no Celular */}
        <button
          type="button"
          onClick={finishSession}
          className="w-full border-2 border-zinc-950 bg-zinc-950 px-4 py-3.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-zinc-800 transition"
        >
          ✓ Concluir Captura ({photos.length} {photos.length === 1 ? 'foto' : 'fotos'})
        </button>
      </main>
    </div>
  );
}
