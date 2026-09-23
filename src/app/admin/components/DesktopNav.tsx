'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from './LogoutButton';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/os', label: 'OS' },
  { href: '/admin/clientes', label: 'Clientes' },
  { href: '/admin/estoque', label: 'Estoque' },
  { href: '/admin/vendas', label: 'Vendas' },
  { href: '/admin/comissoes', label: 'Comissões' },
  { href: '/admin/pecas', label: 'Peças' },
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
}: {
  userName: string;
  roleLabel: string;
}) {
  const pathname = usePathname();

  return (
    <div className="hidden items-center gap-6 lg:flex">
      <nav className="flex items-center gap-1">
        {LINKS.map((link) => {
          const active = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? 'page' : undefined}
              className={`rounded-md px-2.5 py-1.5 text-xs font-mono font-medium transition ${
                active
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
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
          className="whitespace-nowrap rounded-md bg-white px-3 py-1.5 text-xs font-mono font-bold text-zinc-950 hover:bg-zinc-200 transition"
        >
          + Nova OS
        </Link>
        <Link
          href="/admin/vender"
          className="whitespace-nowrap rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-mono font-bold text-white hover:bg-emerald-500 transition"
        >
          + Vender
        </Link>
        <Link
          href="/admin/pecas/new"
          className="whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-mono font-medium text-zinc-300 hover:bg-zinc-800 transition"
        >
          + Pedido Peça
        </Link>
      </div>

      <div className="flex items-center gap-2 border-l border-zinc-800 pl-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-xs font-mono font-semibold text-zinc-200"
          aria-hidden="true"
        >
          {initials(userName)}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold leading-tight text-white">{userName}</p>
          <p className="text-[10px] font-mono leading-tight text-zinc-400">{roleLabel}</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
