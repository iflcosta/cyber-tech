'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createCRMBrowserClient } from '../lib/supabase/client';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/os', label: 'OS' },
  { href: '/admin/estoque', label: 'Estoque' },
  { href: '/admin/vendas', label: 'Vendas' },
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

  // Fecha o menu sempre que a rota muda (clique num link)
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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
        className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 hover:bg-slate-100"
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
        <div className="absolute inset-x-0 top-full z-20 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white shadow-lg">
          <div className="flex flex-col gap-1 p-4">
            <div className="mb-2 rounded-md bg-slate-50 px-3 py-2.5">
              <p className="text-sm font-medium text-slate-900">{userName}</p>
              <p className="text-xs text-slate-500">{roleLabel}</p>
            </div>

            <Link
              href="/admin/os/new"
              className="mb-1 rounded-md bg-blue-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-blue-700"
            >
              + Nova OS
            </Link>
            <Link
              href="/admin/vender"
              className="mb-3 rounded-md bg-emerald-600 px-4 py-3 text-center text-base font-semibold text-white hover:bg-emerald-700"
            >
              + Vender
            </Link>

            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-4 py-3 text-base font-medium ${
                  pathname === link.href || pathname.startsWith(link.href + '/')
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-4 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-md border border-slate-300 px-4 py-3 text-center text-base font-medium text-slate-700 hover:bg-slate-50"
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
