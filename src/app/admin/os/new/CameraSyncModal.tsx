'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export function CameraSyncModal({
  open,
  onClose,
  onPhotosSynced,
  existingPhotos,
}: {
  open: boolean;
  onClose: () => void;
  onPhotosSynced: (newPhotos: string[]) => void;
  existingPhotos: string[];
}) {
  const [sessionToken] = useState(
    () => `sync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [mobileUrl, setMobileUrl] = useState<string>('');
  const [syncedPhotos, setSyncedPhotos] = useState<string[]>([]);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'completed'>('active');
  const seenRef = useRef<Set<string>>(new Set(existingPhotos));

  // Inicializa sessão e gera QR Code quando o modal abre
  useEffect(() => {
    if (!open) return;

    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://cyberinformatica.tech';
    const url = `${origin}/camera-sync/${sessionToken}`;
    setMobileUrl(url);

    QRCode.toDataURL(url, {
      width: 220,
      margin: 1,
      errorCorrectionLevel: 'M',
    })
      .then(setQrDataUrl)
      .catch(() => {});

    fetch('/api/camera-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: sessionToken, action: 'init' }),
    }).catch(() => {});
  }, [open, sessionToken]);

  // Escuta via Supabase Realtime + Polling de alta confiabilidade (1.5s)
  useEffect(() => {
    if (!open) return;

    let active = true;

    const pushNewPhotos = (incoming: string[]) => {
      const fresh: string[] = [];
      for (const p of incoming) {
        if (!seenRef.current.has(p)) {
          seenRef.current.add(p);
          fresh.push(p);
        }
      }
      if (fresh.length > 0) {
        setSyncedPhotos((prev) => {
          const merged = Array.from(new Set([...prev, ...fresh]));
          return merged;
        });
        onPhotosSynced(fresh);
      }
    };

    // 1. Supabase Realtime Broadcast
    let cleanupRealtime = () => {};
    try {
      const supabase = createCRMBrowserClient();
      const channel = supabase
        .channel(`camera-sync:${sessionToken}`)
        .on('broadcast', { event: 'photo_added' }, (payload) => {
          const photoUrl = payload?.payload?.photoUrl;
          if (typeof photoUrl === 'string' && photoUrl) {
            pushNewPhotos([photoUrl]);
          }
        })
        .subscribe();

      cleanupRealtime = () => {
        supabase.removeChannel(channel);
      };
    } catch {
      // Continua via polling se Realtime não estiver configurado
    }

    // 2. Polling leve na API (/api/camera-sync)
    const interval = setInterval(async () => {
      if (!active) return;
      try {
        const res = await fetch(`/api/camera-sync?token=${encodeURIComponent(sessionToken)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data.photos) && data.photos.length > 0) {
          pushNewPhotos(data.photos);
        }
        if (data.status === 'completed') {
          setSessionStatus('completed');
        }
      } catch {
        // Ignora oscilação momentânea
      }
    }, 1500);

    return () => {
      active = false;
      clearInterval(interval);
      cleanupRealtime();
    };
  }, [open, sessionToken, onPhotosSynced]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-sync-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Cyber Camera Sync · Tempo Real
              </span>
            </div>
            <h2 id="camera-sync-title" className="mt-1 text-lg font-bold text-slate-900">
              Fotografar Carcaça pelo Celular
            </h2>
            <p className="text-xs text-slate-500">
              Aponte a câmera do seu celular para o QR Code abaixo. Sem precisar fazer login.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 sm:items-center">
          {/* Coluna do QR Code */}
          <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4 text-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR Code para abrir câmera no celular"
                className="h-44 w-44 rounded-lg border border-slate-200 bg-white p-2 shadow-xs"
              />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs text-slate-400">
                Gerando QR Code…
              </div>
            )}
            <span className="mt-2 font-mono text-[11px] font-semibold text-slate-600">
              Sessão: {sessionToken.slice(0, 14)}
            </span>
            {mobileUrl && (
              <a
                href={mobileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 text-xs font-semibold text-sky-600 underline hover:text-sky-700"
              >
                Abrir link direto (teste local) ↗
              </a>
            )}
          </div>

          {/* Coluna de Status & Instruções */}
          <div className="space-y-3 text-xs text-slate-600">
            <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 text-sky-900">
              <p className="font-bold">Como funciona (15 segundos):</p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4">
                <li>Escaneie o QR Code com o celular do bolso.</li>
                <li>Bata as 3 fotos guiadas (Frente, Traseira/S/N e Laterais).</li>
                <li>As fotos aparecem aqui na tela do PC automaticamente!</li>
              </ol>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Fotos recebidas:</span>
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700 border border-emerald-200">
                  {syncedPhotos.length}
                </span>
              </div>

              {syncedPhotos.length === 0 ? (
                <p className="mt-2 text-slate-400">
                  Aguardando captura no celular…
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {syncedPhotos.map((url, idx) => (
                    <div
                      key={`${idx}-${url.slice(0, 20)}`}
                      className="aspect-square overflow-hidden rounded-md border border-emerald-300 bg-slate-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Sincronizada ${idx + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sessionStatus === 'completed' && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-center font-semibold text-emerald-800">
                ✓ Captura concluída no celular!
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            ✓ Concluir e Voltar para OS ({syncedPhotos.length} {syncedPhotos.length === 1 ? 'foto' : 'fotos'})
          </button>
        </div>
      </div>
    </div>
  );
}
