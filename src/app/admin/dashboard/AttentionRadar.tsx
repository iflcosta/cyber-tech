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
      <div className="border border-zinc-800 bg-[#111114] p-4 text-zinc-400 font-mono text-xs flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>RADAR OPERACIONAL: Nenhuma pendência crítica travando a bancada hoje.</span>
        </span>
        <span className="text-zinc-400">100% REGULAR</span>
      </div>
    );
  }

  return (
    <div className="border border-zinc-800 bg-[#111114] p-4 sm:p-5 text-white space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-200">
            RADAR DE ATENÇÃO IMEDIATA ({totalAlerts})
          </h2>
        </div>
        <span className="font-mono text-[11px] text-zinc-400 uppercase hidden sm:inline">
          AÇÕES PRIORITÁRIAS DO DIA
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 font-mono text-xs">
        {/* 1. Alerta de Estoque Mínimo do Eduardo (Estante 6m) */}
        {lowStockItems.length > 0 && (
          <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  📦 Estoque Crítico ({lowStockItems.length})
                </span>
                <Link href="/admin/estoque" className="text-[10px] text-zinc-400 hover:text-white underline">
                  Repor →
                </Link>
              </div>
              <ul className="space-y-1.5 divide-y divide-zinc-900">
                {lowStockItems.slice(0, 4).map((item) => (
                  <li key={item.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2">
                    <span className="truncate text-zinc-300">
                      {item.internal_sku ? `[${item.internal_sku}] ` : ''}{item.name}
                    </span>
                    <span className="shrink-0 text-amber-300 font-bold">
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
          <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
                  ✅ Prontas no Balcão ({readyOSs.length})
                </span>
                <Link href="/admin/os?status=ready" className="text-[10px] text-zinc-400 hover:text-white underline">
                  Ver OSs →
                </Link>
              </div>
              <ul className="space-y-1.5 divide-y divide-zinc-900">
                {readyOSs.slice(0, 4).map((os) => (
                  <li key={os.id} className="pt-1.5 first:pt-0">
                    <Link
                      href={`/admin/os/${os.id}`}
                      className="flex items-center justify-between gap-2 text-zinc-300 hover:text-white group"
                    >
                      <span className="truncate">
                        <strong className="text-white">#{os.short_id || os.os_number}</strong> {os.customer_name}
                      </span>
                      <span className="shrink-0 text-emerald-400 text-[10px]">
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
          <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  ⚠️ OS Parada (≥ 3d) ({staleOSs.length})
                </span>
                <Link href="/admin/os?status=all" className="text-[10px] text-zinc-400 hover:text-white underline">
                  Destravar →
                </Link>
              </div>
              <ul className="space-y-1.5 divide-y divide-zinc-900">
                {staleOSs.slice(0, 4).map((os) => (
                  <li key={os.id} className="pt-1.5 first:pt-0">
                    <Link
                      href={`/admin/os/${os.id}`}
                      className="flex items-center justify-between gap-2 text-zinc-300 hover:text-white group"
                    >
                      <span className="truncate">
                        <strong className="text-white">#{os.short_id || os.os_number}</strong> {os.customer_name}
                      </span>
                      <span className="shrink-0 text-amber-400 text-[10px]">
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
          <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                  🚨 Entregue Não Pago ({unpaidOSs.length})
                </span>
                <span className="text-[10px] text-zinc-400">Cobrança</span>
              </div>
              <ul className="space-y-1.5 divide-y divide-zinc-900">
                {unpaidOSs.slice(0, 4).map((os) => (
                  <li key={os.id} className="pt-1.5 first:pt-0">
                    <Link
                      href={`/admin/os/${os.id}`}
                      className="flex items-center justify-between gap-2 text-zinc-300 hover:text-white group"
                    >
                      <span className="truncate">
                        <strong className="text-white">#{os.short_id || os.os_number}</strong> {os.customer_name}
                      </span>
                      <span className="shrink-0 text-rose-300 font-bold">
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
