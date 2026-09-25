import Link from 'next/link';
import { getAuthedProfile } from '@/app/admin/lib/auth';
import { DesktopNav } from '@/app/admin/components/DesktopNav';
import { MobileNav } from '@/app/admin/components/MobileNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user: { id: string } | null = null;
  let profile: { full_name: string | null; role: string | null } | null = null;
  let configError: string | null = null;

  try {
    // getAuthedProfile() é memoizado por request (React cache()) — se
    // a página abaixo também chamar isso (ou getAuthedUser()), reusa
    // o mesmo resultado em vez de bater no Supabase Auth de novo.
    const result = await getAuthedProfile();
    user = result.user;
    profile = result.profile;
  } catch (e) {
    configError = e instanceof Error ? e.message : 'Erro ao inicializar cliente Supabase.';
  }

  // Fallback amigavel se o servidor estiver sem env vars (deploy sem NEXT_PUBLIC_SUPABASE_CRM_*)
  if (configError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-6">
          <h1 className="text-xl font-bold text-amber-900">ERP ainda nao configurado</h1>
          <p className="mt-2 text-sm text-amber-800">
            Faltam variaveis de ambiente do Supabase do CRM neste ambiente.
          </p>
          <pre className="mt-3 overflow-x-auto rounded bg-amber-100 p-3 text-xs text-amber-900">
            {configError}
          </pre>
          <p className="mt-3 text-xs text-amber-800">
            Configure no painel do Vercel (Project &rarr; Settings &rarr; Environment Variables) e faca
            redeploy. Valores necessarios:
          </p>
          <ul className="mt-2 list-disc pl-6 text-xs text-amber-800">
            <li>NEXT_PUBLIC_SUPABASE_CRM_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_CRM_ANON_KEY</li>
          </ul>
        </div>
      </div>
    );
  }

  // Sem usuário logado: a única rota alcançável aqui é /admin/login
  // (o middleware redireciona qualquer outra pra lá). A tela de login
  // já centraliza sozinha na altura da tela inteira — não desenha a
  // barra de topo por cima, senão dobra o espaço vertical e empurra
  // o formulário pra baixo (bug visto no celular).
  if (!user) {
    return <div className="admin-scope">{children}</div>;
  }

  return (
    <div className="admin-scope min-h-dvh bg-zinc-50 text-zinc-900">
      <header className="print:hidden sticky top-0 z-10 border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/admin/os" className="text-lg font-bold tracking-tight text-zinc-900">
            Cyber <span className="font-extrabold text-black">ERP</span>
          </Link>

          <DesktopNav
            userName={profile?.full_name ?? '—'}
            roleLabel={profile?.role === 'owner' ? 'Dono' : 'Técnico'}
          />

          <MobileNav
            userName={profile?.full_name ?? '—'}
            roleLabel={profile?.role === 'owner' ? 'Dono' : 'Técnico'}
          />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
