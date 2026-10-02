'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export function CameraSyncModal({
  open,
  onClose,
  onPhotosSynced,
  existingPhotos,
  osId,
  sessionTokenProp,
}: {
  open: boolean;
  onClose: () => void;
  onPhotosSynced: (newPhotos: string[]) => void;
  existingPhotos: string[];
  osId?: string;
  sessionTokenProp?: string;
}) {
  const [internalToken] = useState(
    () => `sync_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
  );
  const sessionToken = sessionTokenProp || internalToken;
  const [hasActivated, setHasActivated] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [mobileUrl, setMobileUrl] = useState<string>('');
  const [syncedPhotos, setSyncedPhotos] = useState<string[]>([]);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'completed'>('active');
  const seenRef = useRef<Set<string>>(new Set(existingPhotos));

  useEffect(() => {
    if (open && !hasActivated) {
      setHasActivated(true);
    }
  }, [open, hasActivated]);

  // Inicializa sessão e gera QR Code quando ativado pela primeira vez
  useEffect(() => {
    if (!open && !hasActivated) return;

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
      cache: 'no-store',
      body: JSON.stringify({
        token: sessionToken,
        action: 'init',
        ...(osId ? { osId } : {}),
      }),
    }).catch(() => {});
  }, [open, hasActivated, sessionToken, osId]);

  // Escuta via Supabase Realtime + Polling contínuo em background mesmo após fechar o modal
  useEffect(() => {
    if (!open && !hasActivated) return;

    let active = true;

    const pushNewPhotos = (incoming: string[]) => {
      const fresh: string[] = [];
      for (const p of incoming) {
        if (typeof p === 'string' && p.trim() && !seenRef.current.has(p)) {
          seenRef.current.add(p);
          fresh.push(p);
        }
      }
      if (fresh.length > 0) {
        setSyncedPhotos((prev) => Array.from(new Set([...prev, ...fresh])));
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

    // 2. Polling leve na API (/api/camera-sync) com no-store
    const pollNow = async () => {
      if (!active) return;
      try {
        const res = await fetch(
          `/api/camera-sync?token=${encodeURIComponent(sessionToken)}&_t=${Date.now()}`,
          { cache: 'no-store' },
        );
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
    };

    pollNow();
    const interval = setInterval(pollNow, 1500);

    return () => {
      active = false;
      clearInterval(interval);
      cleanupRealtime();
    };
  }, [open, hasActivated, sessionToken, onPhotosSynced]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="camera-sync-title"
    >
      <div className="w-full max-w-lg border-2 border-zinc-950 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b-2 border-zinc-950 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 bg-emerald-500 animate-pulse" />
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-800">
                Cyber Camera Sync · Tempo Real
              </span>
            </div>
            <h2 id="camera-sync-title" className="mt-1 font-mono text-lg font-black uppercase tracking-tight text-zinc-950">
              Fotografar Carcaça pelo Celular
            </h2>
            <p className="font-mono text-xs text-zinc-500">
              Aponte a câmera do seu celular para o QR Code abaixo. Sem precisar fazer login.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-zinc-950 p-1.5 font-mono text-xs font-bold text-zinc-950 hover:bg-zinc-950 hover:text-white transition cursor-pointer"
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 sm:items-center">
          {/* Coluna do QR Code */}
          <div className="flex flex-col items-center border border-zinc-300 bg-zinc-50 p-4 text-center">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={qrDataUrl}
                alt="QR Code para abrir câmera no celular"
                className="h-44 w-44 border-2 border-zinc-950 bg-white p-2"
              />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center border-2 border-zinc-950 bg-white font-mono text-xs text-zinc-400">
                Gerando QR Code…
              </div>
            )}
            <span className="mt-2 font-mono text-[11px] font-semibold text-zinc-600">
              Sessão: {sessionToken.slice(0, 14)}
            </span>
            {mobileUrl && (
              <a
                href={mobileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 underline hover:text-zinc-700"
              >
                Abrir link direto (teste local) ↗
              </a>
            )}
          </div>

          {/* Coluna de Status & Instruções */}
          <div className="space-y-3 text-xs text-zinc-600">
            <div className="border-2 border-zinc-950 bg-zinc-50 p-3 text-zinc-950 font-mono">
              <p className="font-bold uppercase tracking-wider">Como funciona (15 segundos):</p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs font-normal">
                <li>Escaneie o QR Code com o celular do bolso.</li>
                <li>Bata as 3 fotos guiadas (Frente, Traseira/S/N e Laterais).</li>
                <li>As fotos aparecem aqui na tela do PC automaticamente!</li>
              </ol>
            </div>

            <div className="border border-zinc-300 bg-white p-3">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="font-bold uppercase text-zinc-950">Fotos recebidas:</span>
                <span className="bg-zinc-950 px-2 py-0.5 font-mono text-xs font-bold text-white uppercase">
                  {syncedPhotos.length}
                </span>
              </div>

              {syncedPhotos.length === 0 ? (
                <p className="mt-2 font-mono text-xs text-zinc-400">
                  Aguardando captura no celular…
                </p>
              ) : (
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {syncedPhotos.map((url, idx) => (
                    <div
                      key={`${idx}-${url.slice(0, 20)}`}
                      className="aspect-square overflow-hidden border border-zinc-300 bg-zinc-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Sincronizada ${idx + 1}`} className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {sessionStatus === 'completed' && (
              <div className="border-2 border-zinc-950 bg-zinc-100 p-2.5 text-center font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
                ✓ Captura concluída no celular!
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2 border-t-2 border-zinc-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-zinc-950 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-zinc-800 transition cursor-pointer"
          >
            ✓ Concluir e Voltar para OS ({syncedPhotos.length} {syncedPhotos.length === 1 ? 'foto' : 'fotos'})
          </button>
        </div>
      </div>
    </div>
  );
}
