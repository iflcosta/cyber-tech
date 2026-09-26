'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
}

// Emite um bipe de sucesso curto usando a Web Audio API nativa
function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Silencioso se navegador bloquear autoplay de áudio
  }
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Escanear Código de Barras / EAN',
  subtitle = 'Aponte a câmera para o código de barras ou QR Code do produto',
}: BarcodeScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'cyber-barcode-scanner-viewport';

  useEffect(() => {
    if (!isOpen) {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
      return;
    }

    let isMounted = true;
    setError(null);
    setIsStarting(true);

    async function initScanner() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (!devices || devices.length === 0) {
          setError('Nenhuma câmera encontrada neste dispositivo.');
          setIsStarting(false);
          return;
        }

        setCameras(devices);

        // Prioriza a câmera traseira (environment) em smartphones
        const backCamera = devices.find((d) =>
          /back|rear|traseira|ambiente/i.test(d.label),
        );
        const chosenCameraId = backCamera ? backCamera.id : devices[0].id;
        setSelectedCameraId(chosenCameraId);

        const html5QrCode = new Html5Qrcode(containerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
          ],
          verbose: false,
        });

        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          chosenCameraId,
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
            aspectRatio: 1.333,
          },
          (decodedText) => {
            playBeep();
            onScan(decodedText);
            onClose();
          },
          () => {
            // Frame lido sem código — ignora
          },
        );

        if (isMounted) {
          setIsStarting(false);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('Erro ao iniciar câmera:', err);
        setError(
          'Permissão de câmera negada ou câmera ocupada por outro app. Libere o acesso no navegador.',
        );
        setIsStarting(false);
      }
    }

    // Pequeno timeout para o DOM do modal renderizar a div container
    const timer = setTimeout(initScanner, 150);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current = null;
        });
      }
    };
  }, [isOpen, onClose, onScan]);

  async function handleSwitchCamera(cameraId: string) {
    setSelectedCameraId(cameraId);
    if (!scannerRef.current) return;

    try {
      setIsStarting(true);
      await scannerRef.current.stop();
      await scannerRef.current.start(
        cameraId,
        {
          fps: 15,
          qrbox: { width: 280, height: 160 },
          aspectRatio: 1.333,
        },
        (decodedText) => {
          playBeep();
          onScan(decodedText);
          onClose();
        },
        () => {},
      );
    } catch (err) {
      console.error('Erro ao trocar câmera:', err);
      setError('Erro ao alternar câmera.');
    } finally {
      setIsStarting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 p-5 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div>
            <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-white">
              📷 {title}
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition"
            aria-label="Fechar scanner"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="my-6 rounded-lg border border-red-800/60 bg-red-950/40 p-4 text-xs text-red-300">
            <p className="font-bold mb-1">⚠️ Falha ao acessar a câmera</p>
            <p>{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-zinc-800 py-2.5 text-xs font-semibold text-white hover:bg-zinc-700 transition"
            >
              Fechar
            </button>
          </div>
        ) : (
          <div className="my-4">
            <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-black">
              <div id={containerId} className="w-full aspect-4/3 min-h-[260px]" />

              {isStarting && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span className="font-mono text-xs text-zinc-400 uppercase tracking-widest">
                    Iniciando lente...
                  </span>
                </div>
              )}
            </div>

            {cameras.length > 1 && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[11px] text-zinc-400">Alternar câmera:</span>
                <select
                  value={selectedCameraId}
                  onChange={(e) => handleSwitchCamera(e.target.value)}
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-200"
                >
                  {cameras.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label || `Câmera ${c.id.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-zinc-800 pt-3 flex items-center justify-between">
          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
            EAN-13 · EAN-8 · Code 128 · QR
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
