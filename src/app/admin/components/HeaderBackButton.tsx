'use client';

import { usePathname, useRouter } from 'next/navigation';

export function HeaderBackButton() {
  const pathname = usePathname();
  const router = useRouter();

  // Oculta no dashboard principal ou na lista de OS inicial para não poluir
  const isHomeView =
    pathname === '/admin/os' ||
    pathname === '/admin/dashboard' ||
    pathname === '/admin' ||
    pathname === '/admin/login';

  if (isHomeView) {
    return null;
  }

  function handleBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/admin/os');
    }
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      title="Voltar para a tela anterior"
      aria-label="Voltar para a tela anterior"
      className="inline-flex items-center gap-1 border-2 border-zinc-950 bg-white px-2.5 py-1 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer shadow-2xs active:translate-y-px"
    >
      <span aria-hidden="true" className="text-sm font-black leading-none">←</span>
      <span className="hidden sm:inline">Voltar</span>
    </button>
  );
}
