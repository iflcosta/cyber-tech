import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, ShieldAlert } from 'lucide-react';

// Esta rota (Cyber Control antigo) foi descontinuada em 2026-06-15.
// O novo CRM esta em /admin/crm.
// O codigo legado foi mantido no historico do git e pode ser restaurado
// se necessario, mas nao e mais a interface de uso da equipe.

export const dynamic = 'force-dynamic';

export default function DeprecatedAdminPage() {
  // Redireciona automaticamente apos 5s; usuario pode clicar antes
  // Comentado por enquanto pra mostrar a pagina de aviso:
  // setTimeout(() => redirect('/admin/crm'), 5000);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <ShieldAlert className="h-8 w-8 text-amber-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Painel antigo descontinuado
        </h1>
        <p className="mt-3 text-sm text-slate-600">
          A interface "Cyber Control" foi substitu&iacute;da por um novo CRM mais simples,
          feito sob medida para a bancada de assist&ecirc;ncia t&eacute;cnica.
        </p>

        <Link
          href="/admin/crm"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Ir para o novo CRM
          <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="mt-8 text-xs text-slate-400">
          Este aviso &eacute; intencional. O c&oacute;digo legado do Cyber Control continua no
          reposit&oacute;rio (pastas <code className="rounded bg-slate-100 px-1 py-0.5">src/app/admin/components/</code>,
          <code className="rounded bg-slate-100 px-1 py-0.5">hooks/</code> e
          <code className="rounded bg-slate-100 px-1 py-0.5">login/</code>) para consulta hist&oacute;rica,
          mas n&atilde;o &eacute; mais a interface oficial.
        </p>
      </div>
    </main>
  );
}
