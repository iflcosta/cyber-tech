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

            <div className="mt-4 space-y-3 text-xs text-slate-700">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-bold text-slate-900">
                  Opção 1 — Ícone na barra de endereços (Mais rápido)
                </p>
                <p className="mt-1 text-slate-600">
                  Olhe no canto direito da barra de endereço do navegador (ao lado
                  da estrela de favoritos) e clique no ícone de{' '}
                  <strong>computador com uma seta para baixo</strong>{' '}
                  (<em>&ldquo;Instalar Cyber ERP&rdquo;</em>).
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="font-bold text-slate-900">
                  Opção 2 — Pelo menu do Chrome ou Edge
                </p>
                <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-slate-600">
                  <li>
                    Clique nos <strong>3 pontinhos (⋮)</strong> no canto superior
                    direito do navegador.
                  </li>
                  <li>
                    No <strong>Chrome</strong>: vá em{' '}
                    <strong>Transmitir, salvar e compartilhar</strong> &rarr;{' '}
                    <strong>Instalar página como app...</strong>
                  </li>
                  <li>
                    No <strong>Edge</strong>: vá em <strong>Aplicativos</strong>{' '}
                    &rarr; <strong>Instalar este site como um aplicativo</strong>.
                  </li>
                </ol>
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
