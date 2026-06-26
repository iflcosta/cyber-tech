import Link from 'next/link';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { LogoutButton } from '@/app/admin/crm/components/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let user: { id: string } | null = null;
  let profile: { full_name: string | null; role: string | null } | null = null;
  let configError: string | null = null;

  try {
    const supabase = await createCRMServerClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user) {
      const { data: p } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', user.id)
        .maybeSingle();
      profile = p;
    }
  } catch (e) {
    configError = e instanceof Error ? e.message : 'Erro ao inicializar cliente Supabase.';
  }

  // Fallback amigavel se o servidor estiver sem env vars (deploy sem NEXT_PUBLIC_SUPABASE_CRM_*)
  if (configError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-6">
          <h1 className="text-xl font-bold text-amber-900">CRM ainda nao configurado</h1>
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/crm/os" className="text-lg font-bold tracking-tight text-slate-900">
              Cyber <span className="text-blue-600">CRM</span>
            </Link>
            <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 sm:inline">
              v0.1 · interno
            </span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <>
                <Link
                  href="/admin/crm/dashboard"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/crm/os"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  OS
                </Link>
                <Link
                  href="/admin/crm/estoque"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Estoque
                </Link>
                <Link
                  href="/admin/crm/vendas"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Vendas
                </Link>
                <Link
                  href="/admin/crm/os/new"
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  + Nova OS
                </Link>
                <Link
                  href="/admin/crm/vender"
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  + Vender
                </Link>
                <div className="ml-2 flex items-center gap-2 border-l border-slate-200 pl-3">
                  <div className="hidden text-right sm:block">
                    <p className="text-sm font-medium text-slate-900">{profile?.full_name ?? '—'}</p>
                    <p className="text-xs text-slate-500">
                      {profile?.role === 'owner' ? 'Dono' : 'Técnico'}
                    </p>
                  </div>
                  <LogoutButton />
                </div>
              </>
            ) : (
              <Link
                href="/admin/crm/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Entrar
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
