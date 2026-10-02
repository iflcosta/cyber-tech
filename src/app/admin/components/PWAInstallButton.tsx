'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

function subscribeStandalone(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(display-mode: standalone)');
  mql.addEventListener('change', callback);
  window.addEventListener('appinstalled', callback);
  return () => {
    mql.removeEventListener('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone ===
      true
  );
}

function getStandaloneServerSnapshot(): boolean {
  return false;
}

export function PWAInstallButton({ mobile = false }: { mobile?: boolean }) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installedNow, setInstalledNow] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot,
  );

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Ignora erro silenciosamente
      });
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => {
      setDeferredPrompt(null);
      setInstalledNow(true);
      setShowHelpModal(false);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  if (isStandalone || installedNow) return null;

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
      return;
    }
    setShowHelpModal(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        title="Instalar Cyber ERP na Área de Trabalho"
        className={
          mobile
            ? 'mb-2 flex w-full items-center justify-center gap-2 border-2 border-zinc-950 bg-white px-4 py-2.5 text-center font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition'
            : 'inline-flex items-center gap-1.5 whitespace-nowrap border-2 border-zinc-950 bg-white px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition'
        }
      >
        <span aria-hidden="true">📱</span>
        <span>Instalar PWA</span>
      </button>

      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="w-full max-w-md border-2 border-zinc-950 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b-2 border-zinc-950 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center border border-zinc-950 bg-zinc-950 text-base text-white">
                  📱
                </span>
                <div>
                  <h3 className="font-black uppercase tracking-tight text-zinc-950">
                    Instalar Cyber ERP PWA
                  </h3>
                  <p className="text-xs font-mono uppercase text-zinc-600">
                    Acesso rápido de bancada no mobile e desktop
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="font-mono p-1 text-zinc-400 hover:text-zinc-950"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-zinc-800">
              {/* iPhone / Safari */}
              <div className="border border-zinc-950 bg-zinc-50 p-3 font-mono">
                <p className="font-bold uppercase tracking-wide text-zinc-950 flex items-center gap-1.5">
                  <span>📱</span>
                  <span>iPhone / iPad (Safari)</span>
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-zinc-700">
                  <li>
                    Toque no ícone de <strong>Compartilhar</strong> (o quadrado com a seta para cima na barra inferior).
                  </li>
                  <li>
                    Role as opções e toque em <strong>&ldquo;Adicionar à Tela de Início&rdquo;</strong> (ícone com sinal de <strong>+</strong>).
                  </li>
                  <li>
                    Toque em <strong>&ldquo;Adicionar&rdquo;</strong> no canto superior direito. O app abrirá em tela cheia sem barra de navegador!
                  </li>
                </ol>
              </div>

              {/* Android / Chrome */}
              <div className="border border-zinc-950 bg-zinc-50 p-3 font-mono">
                <p className="font-bold uppercase tracking-wide text-zinc-950 flex items-center gap-1.5">
                  <span>🤖</span>
                  <span>Android (Chrome)</span>
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-zinc-700">
                  <li>
                    Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome.
                  </li>
                  <li>
                    Selecione <strong>&ldquo;Instalar aplicativo&rdquo;</strong> ou <strong>&ldquo;Adicionar à tela inicial&rdquo;</strong>.
                  </li>
                </ol>
              </div>

              {/* Computador / Windows / Mac */}
              <div className="border border-zinc-300 bg-zinc-50 p-3 font-mono">
                <p className="font-bold uppercase tracking-wide text-zinc-950 flex items-center gap-1.5">
                  <span>🖥️</span>
                  <span>Computador (Chrome / Edge)</span>
                </p>
                <p className="mt-1 text-zinc-700">
                  Clique no ícone de <strong>computador com seta</strong> no canto direito da barra de endereços (ao lado dos favoritos) ou acesse o menu <strong>⋮ &rarr; Instalar página como app</strong>.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="border-2 border-zinc-950 bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
