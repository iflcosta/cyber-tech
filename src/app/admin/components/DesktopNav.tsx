'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from './LogoutButton';
import { PWAInstallButton } from './PWAInstallButton';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/os', label: 'OS' },
  { href: '/admin/caixa', label: 'Caixa' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/clientes/leads', label: 'Leads TI', iagoOnly: true },
  { href: '/admin/estoque', label: 'Estoque' },
  { href: '/admin/termo-compra-usado', label: 'Compra Usados' },
  { href: '/admin/vendas', label: 'Vendas' },
  { href: '/admin/comissoes', label: 'Comissões' },
  { href: '/admin/pecas', label: 'Compras' },
  { href: '/admin/fornecedores', label: 'Fornecedores' },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function DesktopNav({
  userName,
  roleLabel,
  showLeadsTab = false,
}: {
  userName: string;
  roleLabel: string;
  showLeadsTab?: boolean;
}) {
  const pathname = usePathname();
  const visibleLinks = LINKS.filter((link) => !link.iagoOnly || showLeadsTab);

  return (
    <div className="hidden items-center gap-4 xl:gap-6 lg:flex">
      <nav className="flex items-center gap-1">
        {visibleLinks.map((link) => {
          const active =
            pathname === link.href ||
            (pathname.startsWith(link.href + '/') &&
              !(link.href === '/admin/clientes' && pathname.startsWith('/admin/clientes/leads')));
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`px-2.5 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition ${
                active
                  ? 'bg-zinc-950 text-white'
                  : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/admin/os/new"
          className="whitespace-nowrap bg-zinc-950 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition"
        >
          + Nova OS
        </Link>
        <Link
          href="/admin/vender"
          className="whitespace-nowrap border-2 border-zinc-950 bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
        >
          + Vender
        </Link>
        <Link
          href="/admin/pecas/new"
          className="whitespace-nowrap border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-zinc-800 hover:bg-zinc-200 transition"
        >
          + Pedido Peça
        </Link>
      </div>

      <div className="flex items-center gap-2.5 border-l-2 border-zinc-200 pl-4">
        <PWAInstallButton />
        <Link
          href="/admin/configuracoes"
          title="Configurações do Sistema"
          aria-label="Configurações do Sistema"
          className={`flex h-8 w-8 shrink-0 items-center justify-center border-2 border-zinc-950 font-mono text-xs font-bold transition hover:bg-zinc-100 cursor-pointer ${
            pathname.startsWith('/admin/configuracoes') ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-950'
          }`}
        >
          ⚙️
        </Link>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center bg-zinc-950 font-mono text-xs font-bold text-white uppercase"
          aria-hidden="true"
        >
          {initials(userName)}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs font-bold font-mono leading-tight text-zinc-950">{userName}</p>
          <p className="font-mono text-[10px] font-semibold uppercase leading-tight text-zinc-500">{roleLabel}</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
