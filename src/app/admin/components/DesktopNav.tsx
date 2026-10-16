'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from './LogoutButton';
import { PWAInstallButton } from './PWAInstallButton';

type NavSubItem = {
  href: string;
  label: string;
  icon?: string;
  desc?: string;
  iagoOnly?: boolean;
  hideForReceptionist?: boolean;
};

type NavSection = {
  id: string;
  label: string;
  icon?: string;
  directHref?: string;
  items?: NavSubItem[];
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DesktopNav({
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
  const pathname = usePathname();
  const isReceptionist = userRole === 'receptionist';
  const isOwner = userRole === 'owner';
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fecha dropdowns se mudar de rota
  useEffect(() => {
    setOpenDropdown(null);
  }, [pathname]);

  function handleMouseEnter(id: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpenDropdown(id);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => {
      setOpenDropdown(null);
    }, 150);
  }

  const SECTIONS: NavSection[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: '📊',
      directHref: '/admin/dashboard',
    },
    {
      id: 'os',
      label: 'Bancada (OS)',
      icon: '🔧',
      directHref: '/admin/os',
    },
    {
      id: 'balcao',
      label: 'Balcão & Vendas',
      icon: '⚡',
      items: [
        { href: '/admin/vender', label: 'PDV / Nova Venda', icon: '⚡', desc: 'Bipagem e checkout rápido' },
        { href: '/admin/vendas', label: 'Histórico de Vendas', icon: '🛍️', desc: 'Vendas balcão e notas' },
        { href: '/admin/termo-compra-usado', label: 'Compra de Usados', icon: '📄', desc: 'Termos e contrato A4 (Art. 180 CP)' },
      ],
    },
    {
      id: 'estoque',
      label: 'Estoque & Peças',
      icon: '📦',
      items: [
        { href: '/admin/estoque', label: 'Catálogo de Estoque', icon: '📦', desc: 'Peças, produtos e categorias' },
        { href: '/admin/estoque/novo-aparelho', label: 'Cadastrar Aparelho / PC', icon: '💻', desc: 'Notebooks, PCs e celulares' },
        { href: '/admin/pecas', label: 'Compras & Encomendas', icon: '🚚', desc: 'Pedidos de peças a fornecedores' },
        { href: '/admin/fornecedores', label: 'Fornecedores', icon: '🏢', desc: 'Contatos e parcerias' },
      ],
    },
    {
      id: 'financeiro',
      label: 'Financeiro',
      icon: '💰',
      items: [
        { href: '/admin/caixa', label: 'Caixa Diário', icon: '💵', desc: 'Abertura, sangrias e fechamento cego' },
        { href: '/admin/contas-a-receber', label: 'A Receber & Fiado', icon: '💰', desc: 'Cobrança WhatsApp e baixa' },
        { href: '/admin/comissoes', label: 'Comissões Técnicas', icon: '📊', desc: 'Planilha e acerto 30% M.O.', hideForReceptionist: true },
      ],
    },
    {
      id: 'clientes',
      label: 'Clientes',
      icon: '👥',
      items: [
        { href: '/admin/clientes', label: 'Lista de Clientes', icon: '👥', desc: 'Histórico de OS e cadastros' },
        { href: '/admin/clientes/leads', label: 'Leads TI / B2B', icon: '💼', desc: 'Prospecção empresarial (Iago)', iagoOnly: true },
      ],
    },
  ];

  return (
    <div className="hidden items-center gap-4 xl:gap-5 lg:flex">
      {/* NAVEGAÇÃO PRINCIPAL AGRUPADA */}
      <nav className="flex items-center gap-1">
        {SECTIONS.map((sec) => {
          // Link Direto (Dashboard, OS)
          if (sec.directHref) {
            const active =
              pathname === sec.directHref ||
              (sec.directHref !== '/admin/dashboard' && pathname.startsWith(sec.directHref + '/'));

            return (
              <Link
                key={sec.id}
                href={sec.directHref}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition rounded-none flex items-center gap-1.5 ${
                  active
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                <span>{sec.icon}</span>
                <span>{sec.label}</span>
              </Link>
            );
          }

          // Filtra sub-itens com permissões
          const visibleSubItems = (sec.items ?? []).filter(
            (item) =>
              (!item.iagoOnly || showLeadsTab) &&
              (!item.hideForReceptionist || !isReceptionist),
          );

          if (visibleSubItems.length === 0) return null;

          // Se qualquer sub-item for a rota atual, marca o grupo como ativo
          const isGroupActive = visibleSubItems.some(
            (item) =>
              pathname === item.href ||
              (pathname.startsWith(item.href + '/') &&
                !(item.href === '/admin/clientes' && pathname.startsWith('/admin/clientes/leads'))),
          );

          const isOpen = openDropdown === sec.id;

          return (
            <div
              key={sec.id}
              className="relative"
              onMouseEnter={() => handleMouseEnter(sec.id)}
              onMouseLeave={handleMouseLeave}
            >
              <button
                type="button"
                onClick={() => setOpenDropdown(isOpen ? null : sec.id)}
                className={`px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition flex items-center gap-1.5 cursor-pointer ${
                  isGroupActive
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : isOpen
                      ? 'bg-zinc-200 text-zinc-950'
                      : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
                }`}
              >
                <span>{sec.icon}</span>
                <span>{sec.label}</span>
                <span className="text-[9px] opacity-60">▾</span>
              </button>

              {/* DROPDOWN MENU BRUTALISTA */}
              {isOpen && (
                <div className="absolute left-0 top-full z-50 mt-0.5 w-64 border-2 border-zinc-950 bg-white p-1.5 shadow-2xl font-mono animate-in fade-in zoom-in-95 duration-100">
                  <div className="space-y-0.5">
                    {visibleSubItems.map((sub) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`flex items-start gap-2.5 p-2 transition ${
                            isSubActive
                              ? 'bg-zinc-950 text-white'
                              : 'hover:bg-zinc-100 text-zinc-800'
                          }`}
                        >
                          <span className="text-base shrink-0 mt-0.5">{sub.icon}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider leading-tight">
                              {sub.label}
                            </p>
                            {sub.desc && (
                              <p
                                className={`text-[10px] leading-snug mt-0.5 ${
                                  isSubActive ? 'text-zinc-300' : 'text-zinc-500'
                                }`}
                              >
                                {sub.desc}
                              </p>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* BOTÕES DE AÇÃO RÁPIDA */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/os/new"
          className="whitespace-nowrap bg-zinc-950 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition shadow-xs flex items-center gap-1.5"
          title="Nova Ordem de Serviço (Atalho: F3)"
        >
          <span>+</span>
          <span>Nova OS</span>
          <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1 py-0.5 font-normal ml-0.5">F3</span>
        </Link>
        <Link
          href="/admin/vender"
          className="whitespace-nowrap border-2 border-zinc-950 bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition shadow-xs flex items-center gap-1.5"
          title="PDV / Nova Venda (Atalho: F2)"
        >
          <span>+ Vender</span>
          <span className="text-[9px] bg-zinc-100 text-zinc-600 px-1 py-0.5 font-normal border border-zinc-300">F2</span>
        </Link>
      </div>

      {/* PERFIL, CONFIGURAÇÃO & LOGOUT */}
      <div className="flex items-center gap-2.5 border-l-2 border-zinc-200 pl-3">
        <PWAInstallButton />
        {isOwner && (
          <Link
            href="/admin/configuracoes"
            title="Configurações do Sistema"
            aria-label="Configurações do Sistema"
            className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-zinc-950 font-mono text-xs font-bold transition hover:bg-zinc-100 cursor-pointer ${
              pathname.startsWith('/admin/configuracoes')
                ? 'bg-zinc-950 text-white'
                : 'bg-white text-zinc-950'
            }`}
          >
            ⚙️
          </Link>
        )}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center bg-zinc-950 font-mono text-xs font-bold text-white uppercase"
          aria-hidden="true"
        >
          {initials(userName)}
        </div>
        <div className="hidden text-right xl:block">
          <p className="text-xs font-bold font-mono leading-tight text-zinc-950">{userName}</p>
          <p className="font-mono text-[10px] font-semibold uppercase leading-tight text-zinc-500">
            {roleLabel}
          </p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
