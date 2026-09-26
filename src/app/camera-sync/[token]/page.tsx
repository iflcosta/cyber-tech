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
] as const;

async function compressToBlobAndDataUrl(
  file: File,
  maxDimension = 1280,
  quality = 0.78,
): Promise<{ file: File; dataUrl: string }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');
  ctx.drawImage(bitmap, 0, 0, width, height);

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
        const res = await fetch(`/api/camera-sync?token=${encodeURIComponent(token)}`);
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

      for (const rawFile of Array.from(files)) {
        const { file, dataUrl } = await compressToBlobAndDataUrl(rawFile, 1280, 0.78);
        let finalUrl = dataUrl;

        // Tenta subir para o bucket público equipment-photos se disponível
        if (supabase) {
          try {
            const path = `sync-${token}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.jpg`;
            const { error: upErr } = await supabase.storage
              .from('equipment-photos')
              .upload(path, file, { contentType: 'image/jpeg' });
            if (!upErr) {
              const { data: pub } = supabase.storage.from('equipment-photos').getPublicUrl(path);
              if (pub?.publicUrl) finalUrl = pub.publicUrl;
            }
          } catch {
            // Usa o dataUrl comprimido como fallback instantâneo
          }
        }

        // Sincroniza via API
        const res = await fetch('/api/camera-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token,
            action: 'add_photo',
            photoUrl: finalUrl,
          }),
        });

        if (res.ok) {
          const updated = await res.json();
          if (Array.isArray(updated.photos)) {
            setPhotos(updated.photos);
          } else {
            setPhotos((prev) => [...prev, finalUrl]);
          }
        } else {
          setPhotos((prev) => [...prev, finalUrl]);
        }

        // Dispara broadcast via Supabase Realtime se disponível
        if (supabase) {
          try {
            const channel = supabase.channel(`camera-sync:${token}`);
            channel.subscribe((subStatus) => {
              if (subStatus === 'SUBSCRIBED') {
                channel.send({
                  type: 'broadcast',
                  event: 'photo_added',
                  payload: { photoUrl: finalUrl, slot: slotLabel },
                });
              }
            });
          } catch {
            // Ignora falha de broadcast se API já salvou
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
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#FAFAFA] px-5 text-center text-slate-900">
        <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl">
            ✅
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Fotos Sincronizadas no Balcão!
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            <strong>{photos.length}</strong> {photos.length === 1 ? 'foto foi anexada' : 'fotos foram anexadas'} diretamente à Ordem de Serviço no computador do balcão.
          </p>
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
            Você já pode guardar o celular no bolso e concluir a impressão da etiqueta 58mm no PC.
          </p>
          <button
            type="button"
            onClick={() => setStatus('active')}
            className="mt-5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            + Tirar mais fotos nesta sessão
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#FAFAFA] pb-12 text-slate-900">
      {/* Header Mobile Modern Retail */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-bold tracking-tight text-slate-900">
              Cyber Camera Sync
            </span>
          </div>
          <span className="rounded-md bg-sky-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-700 border border-sky-200">
            {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 pt-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <h1 className="text-base font-bold text-slate-900">
            Vistoria Fotográfica de Check-in
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Toque em cada ângulo abaixo para abrir a câmera traseira. As fotos aparecem em tempo real na tela do PC.
          </p>
        </div>

        {feedback && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            {feedback}
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
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
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-4 transition active:scale-[0.99] ${
                  hasPhotoForSlot
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-white hover:border-sky-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${
                      hasPhotoForSlot
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    {hasPhotoForSlot ? '✓' : slot.icon}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{slot.title}</div>
                    <div className="text-xs text-slate-500">{slot.subtitle}</div>
                  </div>
                </div>

                <span
                  className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold ${
                    isUploading
                      ? 'bg-amber-100 text-amber-800'
                      : hasPhotoForSlot
                        ? 'bg-white border border-emerald-300 text-emerald-700'
                        : 'bg-sky-600 text-white shadow-xs'
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
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-white p-3.5 text-xs font-semibold text-slate-700 hover:border-sky-400 hover:bg-sky-50/30 transition">
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
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fotos já no PC do Balcão ({photos.length})
              </span>
              <span className="text-[11px] font-semibold text-emerald-600">
                Sincronizado ✓
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((url, idx) => (
                <div
                  key={`${idx}-${url.slice(0, 24)}`}
                  className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`Foto ${idx + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-1 left-1 rounded bg-slate-900/75 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
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
          className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
        >
          ✓ Concluir Captura ({photos.length} {photos.length === 1 ? 'foto' : 'fotos'})
        </button>
      </main>
    </div>
  );
}
