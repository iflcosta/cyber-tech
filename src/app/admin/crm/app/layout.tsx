import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createCRMServerClient } from '@/app/admin/crm/lib/supabase/server';
import { LogoutButton } from '@/app/admin/crm/components/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/admin/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/os" className="text-lg font-bold tracking-tight text-slate-900">
              Cyber <span className="text-blue-600">CRM</span>
            </Link>
            <span className="hidden rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 sm:inline">
              v0.1 · interno
            </span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/admin/os"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              OS
            </Link>
            <Link
              href="/admin/os/new"
              className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Nova OS
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
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
