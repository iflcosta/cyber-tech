'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createCRMBrowserClient } from '../lib/supabase/client';
import { PWAInstallButton } from './PWAInstallButton';

type MobileNavItem = {
  href: string;
  label: string;
  icon?: string;
  iagoOnly?: boolean;
  hideForReceptionist?: boolean;
  ownerOnly?: boolean;
};

type MobileNavGroup = {
  title: string;
  items: MobileNavItem[];
};

export function MobileNav({
  userName,
  roleLabel,
  userRole,
  showLeadsTab = false,
}: {
  userName: string;
  roleLabel: string;
  userRole?: string;
  showLeadsTab?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const isReceptionist = userRole === 'receptionist';
  const isOwner = userRole === 'owner';

  // Fecha o menu sempre que a rota muda
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

  const GROUPS: MobileNavGroup[] = [
    {
      title: 'OPERACIONAL',
      items: [
        { href: '/admin/dashboard', label: 'Dashboard Geral', icon: '📊' },
        { href: '/admin/os', label: 'Bancada de OS', icon: '🔧' },
        { href: '/admin/vender', label: 'PDV / Nova Venda', icon: '⚡' },
        { href: '/admin/vendas', label: 'Histórico de Vendas', icon: '🛍️' },
        { href: '/admin/termo-compra-usado', label: 'Compra de Usados (Art. 180)', icon: '📄' },
      ],
    },
    {
      title: 'ESTOQUE & SUPRIMENTOS',
      items: [
        { href: '/admin/estoque', label: 'Catálogo de Estoque', icon: '📦' },
        { href: '/admin/estoque/novo-aparelho', label: 'Cadastrar Aparelho / PC', icon: '💻' },
        { href: '/admin/pecas', label: 'Compras & Peças', icon: '🚚' },
        { href: '/admin/fornecedores', label: 'Fornecedores', icon: '🏢' },
      ],
    },
    {
      title: 'FINANCEIRO & CRÉDITO',
      items: [
        { href: '/admin/caixa', label: 'Caixa Diário', icon: '💵' },
        { href: '/admin/contas-a-receber', label: 'A Receber & Fiado', icon: '💰' },
        { href: '/admin/comissoes', label: 'Comissões Técnicas', icon: '📊', hideForReceptionist: true },
      ],
    },
    {
      title: 'CLIENTES & COMERCIAL',
      items: [
        { href: '/admin/clientes', label: 'Lista de Clientes', icon: '👥' },
        { href: '/admin/clientes/leads', label: 'Leads TI / B2B', icon: '💼', iagoOnly: true },
      ],
    },
    {
      title: 'ADMINISTRAÇÃO',
      items: [
        { href: '/admin/configuracoes', label: 'Configurações da Loja', icon: '⚙️', ownerOnly: true },
      ],
    },
  ];

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
        <div className="absolute inset-x-0 top-full z-40 max-h-[calc(100vh-4rem)] overflow-y-auto border-b-2 border-zinc-950 bg-white shadow-2xl font-mono">
          <div className="flex flex-col gap-3 p-4">
            {/* PERFIL */}
            <div className="border-2 border-zinc-950 bg-zinc-100 px-3.5 py-2.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-950">{userName}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">{roleLabel}</p>
              </div>
              <PWAInstallButton mobile />
            </div>

            {/* AÇÕES RÁPIDAS PRINCIPAIS */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/os/new"
                className="bg-zinc-950 px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition flex items-center justify-center gap-1.5"
              >
                <span>+</span>
                <span>Nova OS</span>
              </Link>
              <Link
                href="/admin/vender"
                className="border-2 border-zinc-950 bg-white px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition flex items-center justify-center gap-1.5"
              >
                <span>⚡</span>
                <span>Vender PDV</span>
              </Link>
            </div>

            {/* GRUPOS DE NAVEGAÇÃO */}
            <div className="space-y-3 pt-1">
              {GROUPS.map((group) => {
                const visibleItems = group.items.filter(
                  (item) =>
                    (!item.iagoOnly || showLeadsTab) &&
                    (!item.hideForReceptionist || !isReceptionist) &&
                    (!item.ownerOnly || isOwner),
                );

                if (visibleItems.length === 0) return null;

                return (
                  <div key={group.title} className="space-y-1">
                    <span className="block px-2 text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-zinc-200 pb-1">
                      {group.title}
                    </span>
                    <div className="space-y-0.5">
                      {visibleItems.map((item) => {
                        const active =
                          pathname === item.href ||
                          (pathname.startsWith(item.href + '/') &&
                            !(item.href === '/admin/clientes' && pathname.startsWith('/admin/clientes/leads')));

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition flex items-center gap-2 ${
                              active
                                ? 'bg-zinc-950 text-white'
                                : 'text-zinc-800 hover:bg-zinc-100'
                            }`}
                          >
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* LOGOUT */}
            <div className="border-t-2 border-zinc-200 pt-3">
              <button
                type="button"
                onClick={logout}
                className="w-full border-2 border-zinc-950 bg-white px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
              >
                Encerrar Sessão (Sair)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
