import { LoginForm } from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Cyber <span className="text-blue-600">CRM</span>
          </h1>
          <p className="mt-2 text-sm text-slate-500">Acesso interno da assistência técnica</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-xs text-slate-400">
          Voltar para <a href="/" className="underline">cyberinformatica.tech</a>
        </p>
      </div>
    </div>
  );
}
