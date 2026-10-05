import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { DeviceRegisterForm } from './DeviceRegisterForm';

export const dynamic = 'force-dynamic';

export default async function NewDevicePage() {
  const { user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-950 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              Venda &amp; Vitrine
            </span>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-zinc-950">
              Cadastro de Aparelhos &amp; Máquinas
            </h1>
          </div>
          <p className="mt-0.5 font-mono text-xs text-zinc-600">
            Cadastre <strong>Celulares, Notebooks e Computadores</strong> com ficha técnica estruturada, margem de lucro e etiqueta personalizada.
          </p>
        </div>

        <Link
          href="/admin/estoque/new"
          className="border border-zinc-400 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-700 hover:bg-zinc-100 transition"
        >
          ← Cadastrar Peça Comum / Periférico
        </Link>
      </div>

      <DeviceRegisterForm />
    </div>
  );
}
