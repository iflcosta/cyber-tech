import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  // Se ja tem sessao valida, nao mostra o formulario de novo — manda
  // direto pra dentro. Sem isso, acessar /login logado sempre mostrava
  // a tela de login (nunca redirecionava sozinho).
  const { user } = await getAuthedUser();
  if (user) redirect('/admin/os');

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Cyber <span className="font-extrabold text-black">ERP</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Acesso interno da assistência técnica</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-slate-500">
          Voltar para <Link href="/" className="underline">cyberinformatica.tech</Link>
        </p>
      </div>
    </div>
  );
}
