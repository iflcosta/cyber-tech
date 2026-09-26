import Link from 'next/link';
import { UserContext } from '@/app/admin/lib/rbac';

interface AttentionRadarProps {
  userCtx: UserContext;
  staleOSs: Array<{ id: string; short_id: string | null; os_number: string | null; customer_name: string; days_since_update: number; equipment?: string }>;
  readyOSs: Array<{ id: string; short_id: string | null; os_number: string | null; customer_name: string; daysReady: number; equipment?: string }>;
  unpaidOSs: Array<{ id: string; short_id: string | null; os_number: string | null; customer_name: string; daysUnpaid: number; amount: number }>;
  lowStockItems: Array<{ id: string; name: string; current_stock: number; min_stock: number; category?: string | null; internal_sku?: string | null }>;
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function AttentionRadar({
  userCtx,
  staleOSs,
  readyOSs,
  unpaidOSs,
  lowStockItems,
}: AttentionRadarProps) {
  // Se for o Eduardo (estagiário), o foco principal é o estoque baixo
  const isEduardo = userCtx.effectiveRole === 'stock_intern';

  const totalAlerts =
    (isEduardo ? 0 : staleOSs.length + readyOSs.length) +
    (userCtx.canViewStoreFinancials ? unpaidOSs.length : 0) +
    lowStockItems.length;

  if (totalAlerts === 0) {
    return (
      <div className="border-2 border-zinc-950 bg-white p-4 text-zinc-800 font-mono text-xs flex items-center justify-between shadow-xs">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="font-bold">RADAR OPERACIONAL: Nenhuma pendência crítica travando a bancada hoje.</span>
        </span>
        <span className="text-emerald-800 font-black bg-emerald-50 border border-emerald-300 px-2 py-0.5 uppercase text-[10px]">
          100% REGULAR
        </span>
      </div>
    );
  }

  return (
    <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5 text-zinc-950 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          <h2 className="font-mono text-xs font-black uppercase tracking-widest text-zinc-950">
            RADAR DE ATENÇÃO IMEDIATA ({totalAlerts})
          </h2>
        </div>
        <span className="font-mono text-[11px] font-bold text-zinc-500 uppercase hidden sm:inline">
          AÇÕES PRIORITÁRIAS DO DIA
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 font-mono text-xs">
        {/* 1. Alerta de Estoque Mínimo do Eduardo (Estante 6m) */}
        {lowStockItems.length > 0 && (
          <div className="border-2 border-amber-500 bg-amber-50/70 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-950 font-black uppercase tracking-wider text-[11px]">
                  📦 Estoque Crítico ({lowStockItems.length})
                </span>
                <Link href="/admin/estoque" className="text-[10px] font-bold text-amber-900 hover:text-black underline">
                  Repor →
                </Link>
              </div>
              <ul className="space-y-1.5 divide-y divide-amber-200/80">
                {lowStockItems.slice(0, 4).map((item) => (
                  <li key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                    <span className="truncate text-zinc-900 font-medium">
                      {item.internal_sku ? `[${item.internal_sku}] ` : ''}{item.name}
                    </span>
                    <span className="shrink-0 text-amber-950 font-black">
                      {item.current_stock} / min {item.min_stock}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 2. OSs Prontas sem Retirada */}
        {!isEduardo && readyOSs.length > 0 && (
          <div className="border-2 border-emerald-500 bg-emerald-50/70 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-950 font-black uppercase tracking-wider text-[11px]">
                  ✅ Prontas no Balcão ({readyOSs.length})
                </span>
                <Link href="/admin/os?status=ready" className="text-[10px] font-bold text-emerald-900 hover:text-black underline">
                  Ver OSs →
                </Link>
              </div>
              <ul className="space-y-1.5 divide-y divide-emerald-200/80">
                {readyOSs.slice(0, 4).map((os) => (
                  <li key={os.id} className="pt-1.5 first:pt-0">
                    <Link
                      href={`/admin/os/${os.id}`}
                      className="flex items-center justify-between gap-2 text-zinc-900 hover:text-zinc-950 group"
                    >
                      <span className="truncate">
                        <strong className="text-zinc-950 font-bold group-hover:underline">#{os.short_id || os.os_number}</strong> {os.customer_name}
                      </span>
                      <span className="shrink-0 text-emerald-900 font-bold text-[10px]">
                        há {os.daysReady}d
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 3. OSs Paradas na Bancada (≥ 3 dias) */}
        {!isEduardo && staleOSs.length > 0 && (
          <div className="border-2 border-zinc-950 bg-zinc-50 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-950 font-black uppercase tracking-wider text-[11px]">
                  ⚠️ OS Parada (≥ 3d) ({staleOSs.length})
                </span>
                <Link href="/admin/os?status=all" className="text-[10px] font-bold text-zinc-700 hover:text-black underline">
                  Destravar →
                </Link>
              </div>
              <ul className="space-y-1.5 divide-y divide-zinc-200">
                {staleOSs.slice(0, 4).map((os) => (
                  <li key={os.id} className="pt-1.5 first:pt-0">
                    <Link
                      href={`/admin/os/${os.id}`}
                      className="flex items-center justify-between gap-2 text-zinc-900 hover:text-zinc-950 group"
                    >
                      <span className="truncate">
                        <strong className="text-zinc-950 font-bold group-hover:underline">#{os.short_id || os.os_number}</strong> {os.customer_name}
                      </span>
                      <span className="shrink-0 text-amber-700 font-bold text-[10px]">
                        {os.days_since_update}d sem nota
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 4. Clientes Entregues com Pagamento Pendente (Exclusivo Dono / Dev) */}
        {userCtx.canViewStoreFinancials && unpaidOSs.length > 0 && (
          <div className="border-2 border-rose-500 bg-rose-50/70 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-rose-950 font-black uppercase tracking-wider text-[11px]">
                  🚨 Entregue Não Pago ({unpaidOSs.length})
                </span>
                <span className="text-[10px] font-bold text-rose-800">Cobrança</span>
              </div>
              <ul className="space-y-1.5 divide-y divide-rose-200/80">
                {unpaidOSs.slice(0, 4).map((os) => (
                  <li key={os.id} className="pt-1.5 first:pt-0">
                    <Link
                      href={`/admin/os/${os.id}`}
                      className="flex items-center justify-between gap-2 text-zinc-900 hover:text-zinc-950 group"
                    >
                      <span className="truncate">
                        <strong className="text-zinc-950 font-bold group-hover:underline">#{os.short_id || os.os_number}</strong> {os.customer_name}
                      </span>
                      <span className="shrink-0 text-rose-950 font-black">
                        {fmtBRL(os.amount)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
