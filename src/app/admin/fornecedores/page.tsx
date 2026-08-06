import { createCRMServerClient } from '@/app/admin/lib/supabase/server';
import { AddSupplierForm } from './AddSupplierForm';
import { ToggleSupplierActive } from './ToggleSupplierActive';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const supabase = await createCRMServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: suppliers, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('active', { ascending: false })
    .order('name');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Fornecedores</h1>
          <p className="text-sm text-slate-500">
            {(suppliers ?? []).length} cadastrado{(suppliers ?? []).length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <AddSupplierForm />

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          Erro ao carregar fornecedores: {error.message}
        </div>
      )}

      {(suppliers ?? []).length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Nenhum fornecedor cadastrado ainda.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Nome</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Telefone</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Observações</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(suppliers ?? []).map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {s.name}
                    {s.phone && <span className="block text-xs text-slate-500 sm:hidden">{s.phone}</span>}
                  </td>
                  <td className="hidden px-3 py-2 text-slate-600 sm:table-cell">
                    {s.phone ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="hidden px-3 py-2 text-slate-600 sm:table-cell">
                    {s.notes ?? <span className="text-slate-400">—</span>}
                  </td>
                  <td className="px-3 py-2">
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
