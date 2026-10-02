import { redirect } from 'next/navigation';
import { getAuthedUser } from '@/app/admin/lib/auth';
import { AddSupplierForm } from './AddSupplierForm';
import { ToggleSupplierActive } from './ToggleSupplierActive';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const { supabase, user } = await getAuthedUser();
  if (!user) redirect('/admin/login');

  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('active', { ascending: false })
    .order('name');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="font-mono text-2xl font-black uppercase tracking-tight text-zinc-950">Fornecedores</h1>
          <p className="font-mono text-xs uppercase tracking-wider text-zinc-500">
            {(suppliers ?? []).length} cadastrado{(suppliers ?? []).length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <AddSupplierForm />

      {error && (
        <div className="border border-red-500 bg-red-50 p-3 font-mono text-xs text-red-700">
          Erro ao carregar fornecedores: {error.message}
        </div>
      )}

      {(suppliers ?? []).length === 0 ? (
        <div className="border-2 border-dashed border-zinc-300 bg-zinc-50 p-8 text-center">
          <p className="font-mono text-xs text-zinc-500">Nenhum fornecedor cadastrado ainda.</p>
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-zinc-950 bg-white">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b-2 border-zinc-950 bg-zinc-100 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
              <tr>
                <th className="px-3 py-2.5">Nome</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Telefone</th>
                <th className="hidden px-3 py-2.5 sm:table-cell">Observações</th>
                <th className="px-3 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {(suppliers ?? []).map((s) => (
                <tr key={s.id} className="hover:bg-zinc-50 transition">
                  <td className="px-3 py-2.5 font-bold text-zinc-950">
                    {s.name}
                    {s.phone && <span className="block text-[11px] font-normal text-zinc-500 sm:hidden">{s.phone}</span>}
                  </td>
                  <td className="hidden px-3 py-2.5 text-zinc-600 sm:table-cell">
                    {s.phone ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="hidden px-3 py-2.5 text-zinc-600 sm:table-cell">
                    {s.notes ?? <span className="text-zinc-400">—</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <ToggleSupplierActive supplierId={s.id} active={s.active} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
