'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createCRMBrowserClient } from '../lib/supabase/client';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/os', label: 'OS' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/estoque', label: 'Estoque' },
  { href: '/admin/vendas', label: 'Vendas' },
  { href: '/admin/comissoes', label: 'Comissões' },
  { href: '/admin/whatsapp', label: 'WhatsApp VPS' },
  { href: '/admin/pecas', label: 'Peças' },
  { href: '/admin/fornecedores', label: 'Fornecedores' },
];

export function MobileNav({
  userName,
  roleLabel,
}: {
  userName: string;
  roleLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Fecha o menu sempre que a rota muda (clique num link). Ajuste de
  // estado durante o render em vez de useEffect — padrão recomendado
  // pelo próprio React pra "resetar estado quando algo muda": evita o
  // render extra (efeito rodando só depois de já ter pintado a tela
  // com o menu aberto na rota nova).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  async function logout() {
    const supabase = createCRMBrowserClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white shadow-xl">
          <div className="flex flex-col gap-1 p-4">
            <div className="mb-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2.5">
              <p className="text-sm font-semibold text-slate-900">{userName}</p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>

            <Link
              href="/admin/os/new"
              className="mb-1 rounded-lg bg-sky-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-sky-700"
            >
              + Nova OS
            </Link>
            <Link
              href="/admin/vender"
              className="mb-1 rounded-lg bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white hover:bg-emerald-700"
            >
              + Vender
            </Link>
            <Link
              href="/admin/pecas/new"
              className="mb-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              + Pedido Peça
            </Link>

            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`min-h-[44px] flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-sky-50 text-sky-700 border border-sky-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-4 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-center text-base font-medium text-slate-700 hover:bg-slate-50"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
