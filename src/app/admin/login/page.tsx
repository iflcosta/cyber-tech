import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const { user } = await getAuthedUser();
  if (user) redirect('/admin/os');

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#F4F4F5] px-4 text-zinc-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 border-b-2 border-zinc-950 pb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-950">
              CYBER <span className="bg-zinc-950 px-2 py-0.5 font-mono text-sm text-white">ERP</span>
            </h1>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              R. CEL. TEÓFILO LEME, 967
            </span>
          </div>
          <p className="mt-2 font-mono text-xs uppercase tracking-wider text-zinc-600">
            Acesso Restrito // Balcão &amp; Bancada Técnica
          </p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center font-mono text-xs text-zinc-600">
          ← Voltar para{' '}
          <Link href="/" className="font-bold text-zinc-950 underline underline-offset-4">
            cyberinformatica.tech
          </Link>
        </p>
      </div>
    </div>
  );
}
