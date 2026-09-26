import Link from 'next/link';
import { UserContext } from '@/app/admin/lib/rbac';

interface StockAndSalesGiroProps {
  userCtx: UserContext;
  stockStats: {
    totalItems: number;
    totalUnits: number;
    totalStockValue: number;
    lowStockCount: number;
  };
  topItems: Array<{
    name: string;
    qty: number;
    total: number;
  }>;
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function StockAndSalesGiro({
  userCtx,
  stockStats,
  topItems,
}: StockAndSalesGiroProps) {
  const showValues = userCtx.canViewSalesFinancials || userCtx.canViewStoreFinancials;

  return (
    <div className="border border-zinc-800 bg-[#111114] p-4 sm:p-5 text-white space-y-4 font-mono">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">
            ALMOXARIFADO & VAREJO // ESTANTE DE 6M
          </span>
          <h2 className="text-xs sm:text-sm font-bold uppercase text-white">
            Giro de Estoque do Eduardo & Mais Vendidos no Balcão
          </h2>
        </div>
        <Link
          href="/admin/estoque"
          className="text-xs text-zinc-400 hover:text-white underline"
        >
          Ver Todo Catálogo →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Card 1: Total SKUs Cadastrados */}
        <div className="border border-zinc-800 bg-zinc-950 p-3.5">
          <span className="text-[10px] text-zinc-400 uppercase block mb-1">SKUS CADASTRADOS</span>
          <span className="text-xl sm:text-2xl font-extrabold text-white block">
            {stockStats.totalItems} itens
          </span>
          <span className="text-[10px] text-zinc-400">
            {stockStats.totalUnits} unidades em prateleira
          </span>
        </div>

        {/* Card 2: Alertas de Reposição */}
        <div className={`border p-3.5 ${stockStats.lowStockCount > 0 ? 'border-amber-500/40 bg-amber-500/10' : 'border-zinc-800 bg-zinc-950'}`}>
          <span className="text-[10px] text-zinc-400 uppercase block mb-1">REPOSIÇÃO MÍNIMA</span>
          <span className={`text-xl sm:text-2xl font-extrabold block ${stockStats.lowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>
            {stockStats.lowStockCount} itens críticos
          </span>
          <span className="text-[10px] text-zinc-400">
            {stockStats.lowStockCount > 0 ? 'Abaixo do estoque mínimo' : 'Estoque 100% abastecido'}
          </span>
        </div>

        {/* Card 3: Valor Patrimonial (Apenas Dono / Dev / Iago) */}
        {showValues ? (
          <div className="border border-zinc-800 bg-zinc-950 p-3.5">
            <span className="text-[10px] text-zinc-400 uppercase block mb-1">VALOR EM ESTOQUE</span>
            <span className="text-xl sm:text-2xl font-extrabold text-white block">
              {fmtBRL(stockStats.totalStockValue)}
            </span>
            <span className="text-[10px] text-zinc-400">Preço de venda estimado</span>
          </div>
        ) : (
          <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-400 uppercase block mb-1">ESTANTE 6 METROS</span>
            <span className="text-sm font-bold text-zinc-300 block">
              Organizado por Eduardo
            </span>
            <span className="text-[10px] text-emerald-400">Pronta-entrega no balcão</span>
          </div>
        )}
      </div>

      {/* Top 5 Itens mais vendidos no mês */}
      {topItems.length > 0 && (
        <div className="border border-zinc-800 bg-zinc-950 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase text-zinc-200">
              Mais Vendidos no Balcão (Este Mês)
            </span>
            <span className="text-[10px] text-zinc-400">{topItems.length} itens</span>
          </div>

          <div className="divide-y divide-zinc-900 text-xs">
            {topItems.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-zinc-800 text-zinc-300 rounded flex items-center justify-center font-bold text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-200">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-400">{item.qty} un</span>
                  {showValues && (
                    <strong className="text-white">{fmtBRL(item.total)}</strong>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
