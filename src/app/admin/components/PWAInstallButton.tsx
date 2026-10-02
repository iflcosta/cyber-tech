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
            ? 'mb-2 flex w-full items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-center text-sm font-bold text-emerald-900 hover:bg-emerald-100 transition'
            : 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 transition'
        }
      >
        <span aria-hidden="true">🖥️</span>
        <span>Instalar App</span>
      </button>

      {showHelpModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setShowHelpModal(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 text-base text-white">
                  🖥️
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Instalar Cyber ERP no Computador
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cria atalho na Área de Trabalho e abre em janela dedicada
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5 text-xs text-slate-700">
              {/* iPhone / Safari */}
              <div className="rounded-lg border border-sky-200 bg-sky-50/70 p-3">
                <p className="font-bold text-sky-950 flex items-center gap-1.5">
                  <span>📱</span>
                  <span>No iPhone / iPad (Safari)</span>
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-sky-900">
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
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
                <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>🤖</span>
                  <span>No Android (Chrome)</span>
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-emerald-900">
                  <li>
                    Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome.
                  </li>
                  <li>
                    Selecione <strong>&ldquo;Instalar aplicativo&rdquo;</strong> ou <strong>&ldquo;Adicionar à tela inicial&rdquo;</strong>.
                  </li>
                </ol>
              </div>

              {/* Computador / Windows / Mac */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-bold text-slate-900 flex items-center gap-1.5">
                  <span>🖥️</span>
                  <span>No Computador (Chrome / Edge)</span>
                </p>
                <p className="mt-1 text-slate-600">
                  Clique no ícone de <strong>computador com seta</strong> no canto direito da barra de endereços (ao lado dos favoritos) ou acesse o menu <strong>⋮ &rarr; Instalar página como app</strong>.
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-bold text-white hover:bg-zinc-800"
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
