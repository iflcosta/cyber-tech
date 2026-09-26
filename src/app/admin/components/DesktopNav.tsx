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
              className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
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
          className="whitespace-nowrap bg-zinc-950 px-3 py-1.5 text-xs font-mono font-bold uppercase text-white hover:bg-zinc-800 transition"
        >
          + Nova OS
        </Link>
        <Link
          href="/admin/vender"
          className="whitespace-nowrap border border-zinc-950 bg-white px-3 py-1.5 text-xs font-mono font-bold uppercase text-zinc-950 hover:bg-zinc-100 transition"
        >
          + Vender
        </Link>
        <Link
          href="/admin/pecas/new"
          className="whitespace-nowrap border border-zinc-300 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-200 transition"
        >
          + Pedido Peça
        </Link>
      </div>

      <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
          aria-hidden="true"
        >
          {initials(userName)}
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold leading-tight text-slate-900">{userName}</p>
          <p className="text-[10px] font-medium leading-tight text-slate-500">{roleLabel}</p>
        </div>
        <LogoutButton />
      </div>
    </div>
  );
}
