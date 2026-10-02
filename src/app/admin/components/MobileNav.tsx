'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createCRMBrowserClient } from '../lib/supabase/client';
import { PWAInstallButton } from './PWAInstallButton';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/os', label: 'OS' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/clientes/leads', label: 'Leads TI', iagoOnly: true },
  { href: '/admin/estoque', label: 'Estoque' },
  { href: '/admin/vendas', label: 'Vendas' },
  { href: '/admin/comissoes', label: 'Comissões' },
  { href: '/admin/pecas', label: 'Peças' },
  { href: '/admin/fornecedores', label: 'Fornecedores' },
];

export function MobileNav({
  userName,
  roleLabel,
  showLeadsTab = false,
}: {
  userName: string;
  roleLabel: string;
  showLeadsTab?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const visibleLinks = LINKS.filter((link) => !link.iagoOnly || showLeadsTab);

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
        className="flex h-10 w-10 items-center justify-center border-2 border-zinc-950 text-zinc-950 hover:bg-zinc-100 cursor-pointer"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M6 18L18 6" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b-2 border-zinc-950 bg-white shadow-2xl">
          <div className="flex flex-col gap-1 p-4">
            <div className="mb-2 border-2 border-zinc-950 bg-zinc-100 px-3.5 py-2.5">
              <p className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">{userName}</p>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{roleLabel}</p>
            </div>

            <PWAInstallButton mobile />

            <Link
              href="/admin/os/new"
              className="mb-1 bg-zinc-950 px-4 py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition min-h-[48px] flex items-center justify-center"
            >
              + Nova OS
            </Link>
            <Link
              href="/admin/vender"
              className="mb-1 border-2 border-zinc-950 bg-white px-4 py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition min-h-[48px] flex items-center justify-center"
            >
              + Vender
            </Link>
            <Link
              href="/admin/pecas/new"
              className="mb-3 border border-zinc-300 bg-zinc-50 px-4 py-2.5 text-center font-mono text-xs font-semibold uppercase tracking-wider text-zinc-800 hover:bg-zinc-200 transition min-h-[44px] flex items-center justify-center"
            >
              + Pedido Peça
            </Link>

            {visibleLinks.map((link) => {
              const active =
                pathname === link.href ||
                (pathname.startsWith(link.href + '/') &&
                  !(link.href === '/admin/clientes' && pathname.startsWith('/admin/clientes/leads')));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider transition min-h-[44px] flex items-center ${
                    active
                      ? 'bg-zinc-950 text-white'
                      : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="mt-4 border-t-2 border-zinc-200 pt-4">
              <button
                type="button"
                onClick={logout}
                className="w-full border-2 border-zinc-950 bg-white px-4 py-3 text-center font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
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
