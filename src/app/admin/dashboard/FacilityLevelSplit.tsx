import Link from 'next/link';
import { UserContext } from '@/app/admin/lib/rbac';

interface FacilityLevelSplitProps {
  userCtx: UserContext;
  terreoStats: {
    osCount: number;
    laborRevenue: number;
    pdvSalesCount: number;
    pdvRevenue: number;
  };
  mezaninoStats: {
    osCount: number;
    laborRevenue: number;
    screensCount: number;
    gpusCount: number;
  };
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function FacilityLevelSplit({
  userCtx,
  terreoStats,
  mezaninoStats,
}: FacilityLevelSplitProps) {
  // Se for o Eduardo (estagiário), ele não vê valores monetários
  const showMoney = userCtx.canViewSalesFinancials || userCtx.canViewStoreFinancials;

  return (
    <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5 text-zinc-950 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-zinc-200 pb-3 font-mono">
        <div>
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
            PRODUÇÃO TÉCNICA // DOIS ANDARES
          </span>
          <h2 className="text-xs sm:text-sm font-black uppercase text-zinc-950">
            Nível 01 (Térreo 6m) vs Nível 02 (Mezanino OCA & BGA)
          </h2>
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase hidden sm:inline">
          CENTROS OPERACIONAIS
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 font-mono">
        {/* Nível 01: Térreo (Hardware, Workstations e Balcão) */}
        <div className="border border-zinc-300 bg-zinc-50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>NÍVEL 01 // TÉRREO (PÉ-DIREITO 6M)</span>
              </span>
              <span className="text-[10px] bg-zinc-200 text-zinc-800 px-1.5 py-0.5 font-bold uppercase">IAGO & FELIPE</span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed mb-3">
              Workstations sob medida, upgrades de hardware, formatação rápida e componentes a pronta-entrega.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-zinc-200 pt-3">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">OSs HARDWARE (MÊS)</span>
                <span className="text-base sm:text-lg font-black text-zinc-950 block">
                  {terreoStats.osCount} máquinas
                </span>
                {showMoney && (
                  <span className="text-[11px] text-blue-700 font-bold">
                    {fmtBRL(terreoStats.laborRevenue)}
                  </span>
                )}
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">VENDAS BALCÃO (MÊS)</span>
                <span className="text-base sm:text-lg font-black text-zinc-950 block">
                  {terreoStats.pdvSalesCount} vendas
                </span>
                {showMoney && (
                  <span className="text-[11px] text-blue-700 font-bold">
                    {fmtBRL(terreoStats.pdvRevenue)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between text-xs">
            <Link href="/admin/os?type=desktop" className="text-zinc-700 hover:text-zinc-950 font-bold underline">
              Ver OSs Térreo →
            </Link>
            <Link href="/admin/vender" className="text-zinc-700 hover:text-zinc-950 font-bold underline">
              Abrir PDV →
            </Link>
          </div>
        </div>

        {/* Nível 02: Mezanino Industrial (Microeletrônica & Autoclave OCA) */}
        <div className="border border-zinc-300 bg-zinc-50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-950 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                <span>NÍVEL 02 // MEZANINO INDUSTRIAL</span>
              </span>
              <span className="text-[10px] bg-zinc-200 text-zinc-800 px-1.5 py-0.5 font-bold uppercase">JEFFERSON</span>
            </div>
            <p className="text-[11px] text-zinc-600 leading-relaxed mb-3">
              Autoclave industrial 6.0 Bar e vácuo OCA (-0.08 MPa) para telas originais e estação BGA para placas de vídeo.
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-zinc-200 pt-3">
              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">TELAS OCA (MÊS)</span>
                <span className="text-base sm:text-lg font-black text-zinc-950 block">
                  {mezaninoStats.screensCount} displays
                </span>
                <span className="text-[10px] text-zinc-500 font-medium">Preserva original</span>
              </div>

              <div>
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">GPUS & BGA (MÊS)</span>
                <span className="text-base sm:text-lg font-black text-zinc-950 block">
                  {mezaninoStats.gpusCount} reparos
                </span>
                {showMoney && (
                  <span className="text-[11px] text-purple-700 font-bold">
                    {fmtBRL(mezaninoStats.laborRevenue)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-200 flex items-center justify-between text-xs">
            <Link href="/admin/os?type=smartphone" className="text-zinc-700 hover:text-zinc-950 font-bold underline">
              Ver OSs Mezanino →
            </Link>
            <span className="text-[10px] font-bold text-zinc-500">Autoclave 6.0 Bar Ativa</span>
          </div>
        </div>
      </div>
    </div>
  );
}
