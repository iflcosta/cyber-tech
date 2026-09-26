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
    <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5 text-zinc-950 space-y-4 font-mono shadow-xs">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
            ALMOXARIFADO & VAREJO // GESTÃO DE ESTOQUE
          </span>
          <h2 className="text-xs sm:text-sm font-black uppercase text-zinc-950">
            Giro de Estoque & Mais Vendidos no Balcão
          </h2>
        </div>
        <Link
          href="/admin/estoque"
          className="text-xs text-zinc-600 hover:text-zinc-950 font-bold underline"
        >
          Ver Todo Catálogo →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {/* Card 1: Total SKUs Cadastrados */}
        <div className="border border-zinc-300 bg-zinc-50 p-3.5">
          <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">SKUS CADASTRADOS</span>
          <span className="text-xl sm:text-2xl font-black text-zinc-950 block">
            {stockStats.totalItems} itens
          </span>
          <span className="text-[10px] text-zinc-600">
            {stockStats.totalUnits} unidades em prateleira
          </span>
        </div>

        {/* Card 2: Alertas de Reposição */}
        <div className={`p-3.5 ${stockStats.lowStockCount > 0 ? 'border-2 border-amber-500 bg-amber-50/70' : 'border border-zinc-300 bg-zinc-50'}`}>
          <span className={`text-[10px] font-bold uppercase block mb-1 ${stockStats.lowStockCount > 0 ? 'text-amber-900' : 'text-zinc-500'}`}>REPOSIÇÃO MÍNIMA</span>
          <span className={`text-xl sm:text-2xl font-black block ${stockStats.lowStockCount > 0 ? 'text-amber-950' : 'text-zinc-950'}`}>
            {stockStats.lowStockCount} itens críticos
          </span>
          <span className={`text-[10px] ${stockStats.lowStockCount > 0 ? 'text-amber-800 font-medium' : 'text-zinc-600'}`}>
            {stockStats.lowStockCount > 0 ? 'Abaixo do estoque mínimo' : 'Estoque 100% abastecido'}
          </span>
        </div>

        {/* Card 3: Valor Patrimonial (Apenas Dono / Dev / Iago) */}
        {showValues ? (
          <div className="border border-zinc-300 bg-zinc-50 p-3.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">VALOR EM ESTOQUE</span>
            <span className="text-xl sm:text-2xl font-black text-zinc-950 block">
              {fmtBRL(stockStats.totalStockValue)}
            </span>
            <span className="text-[10px] text-zinc-600">Preço de venda estimado</span>
          </div>
        ) : (
          <div className="border border-zinc-300 bg-zinc-50 p-3.5 flex flex-col justify-between">
            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">CONTROLE DE ESTOQUE</span>
            <span className="text-sm font-black text-zinc-900 block">
              Catálogo Unificado
            </span>
            <span className="text-[10px] text-emerald-700 font-bold">Pronta-entrega no balcão</span>
          </div>
        )}
      </div>

      {/* Top 5 Itens mais vendidos no mês */}
      {topItems.length > 0 && (
        <div className="border border-zinc-300 bg-zinc-50 p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase text-zinc-950">
              Mais Vendidos no Balcão (Este Mês)
            </span>
            <span className="text-[10px] font-bold text-zinc-500">{topItems.length} itens</span>
          </div>

          <div className="divide-y divide-zinc-200 text-xs">
            {topItems.map((item, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-zinc-200 text-zinc-800 flex items-center justify-center font-black text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-900 font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-zinc-600">{item.qty} un</span>
                  {showValues && (
                    <strong className="text-zinc-950 font-black">{fmtBRL(item.total)}</strong>
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
