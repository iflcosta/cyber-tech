'use client';

import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '../lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    const supabase = createCRMBrowserClient();
    await supabase.auth.signOut();
    router.push('/admin/crm/login');
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      title="Sair"
      aria-label="Sair"
    >
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M16.78 9.47a.75.75 0 010 1.06l-2.25 2.25a.75.75 0 11-1.06-1.06l.97-.97H8.75a.75.75 0 010-1.5h5.69l-.97-.97a.75.75 0 011.06-1.06l2.25 2.25z" clipRule="evenodd" />
      </svg>
    </button>
  );
}
