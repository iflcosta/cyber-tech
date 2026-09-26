import Link from 'next/link';
import { UserContext } from '@/app/admin/lib/rbac';

interface CommissionsSummaryProps {
  userCtx: UserContext;
  cycleLabel: string;
  totalPendingPayout: number;
  storeRetainedProfit: number;
  iagoStats: {
    laborTotal: number;
    commissionTotal: number;
    osCount: number;
    status: 'pending' | 'paid_out';
  };
  jeffersonStats: {
    laborTotal: number;
    commissionTotal: number;
    osCount: number;
    status: 'pending' | 'paid_out';
  };
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function CommissionsSummary({
  userCtx,
  cycleLabel,
  totalPendingPayout,
  storeRetainedProfit,
  iagoStats,
  jeffersonStats,
}: CommissionsSummaryProps) {
  // Eduardo (estagiário) não tem acesso a comissões
  if (userCtx.effectiveRole === 'stock_intern') {
    return null;
  }

  // 1. Visão do Dono (Felipe) ou Desenvolvedor (Iago em modo dev)
  if (userCtx.canViewAllCommissions) {
    return (
      <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5 text-zinc-950 space-y-4 font-mono shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-200 pb-3 gap-2">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              FECHAMENTO // SEXTA-FEIRA
            </span>
            <h2 className="text-xs sm:text-sm font-black uppercase text-zinc-950">
              Livro-Razão de Comissões & Lucro Retido da Loja
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-zinc-600 block">{cycleLabel}</span>
            <Link
              href="/admin/comissoes"
              className="text-xs text-emerald-700 hover:text-emerald-950 font-bold underline"
            >
              Abrir Extrato Completo →
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Card Iago (30%) */}
          <div className="border border-zinc-300 bg-zinc-50 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase text-zinc-950">Iago (30%)</span>
                <span className="text-[10px] bg-zinc-200 text-zinc-800 px-1.5 py-0.5 font-bold uppercase">
                  Hardware & PC
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mb-2">
                {iagoStats.osCount} OSs executadas · M.O. {fmtBRL(iagoStats.laborTotal)}
              </p>
              <div className="mt-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">A PAGAR NA SEXTA</span>
                <span className="text-xl font-black text-zinc-950 block">
                  {fmtBRL(iagoStats.commissionTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Jefferson (50/50) */}
          <div className="border border-zinc-300 bg-zinc-50 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase text-zinc-950">Jefferson (50%)</span>
                <span className="text-[10px] bg-zinc-200 text-zinc-800 px-1.5 py-0.5 font-bold uppercase">
                  Mezanino OCA
                </span>
              </div>
              <p className="text-[10px] text-zinc-600 mb-2">
                {jeffersonStats.osCount} OSs executadas · M.O. {fmtBRL(jeffersonStats.laborTotal)}
              </p>
              <div className="mt-1">
                <span className="text-[10px] text-zinc-500 font-bold uppercase block">A PAGAR NA SEXTA</span>
                <span className="text-xl font-black text-zinc-950 block">
                  {fmtBRL(jeffersonStats.commissionTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Lucro Retido da Loja (Felipe) */}
          <div className="border-2 border-emerald-600 bg-emerald-50/60 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-black uppercase text-emerald-950">Lucro Retido Loja</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 font-bold uppercase">
                  Felipe / Caixa
                </span>
              </div>
              <p className="text-[10px] text-emerald-700 font-medium mb-2">
                Margem líquida retida para custos fixos e capital de giro.
              </p>
              <div className="mt-1">
                <span className="text-[10px] text-emerald-800 font-bold uppercase block">MARGEM RETIDA</span>
                <span className="text-xl font-black text-emerald-950 block">
                  {fmtBRL(storeRetainedProfit)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Visão do Técnico Iago (Exclusiva: Apenas seus 30%)
  if (userCtx.effectiveRole === 'hardware_tech') {
    return (
      <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5 text-zinc-950 space-y-3 font-mono shadow-xs">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              MINHA COMISSÃO // FECHAMENTO SEXTA-FEIRA
            </span>
            <h2 className="text-xs sm:text-sm font-black uppercase text-zinc-950">
              Extrato Pessoal de Produção (30% sobre Mão de Obra)
            </h2>
          </div>
          <Link
            href="/admin/comissoes"
            className="text-xs text-zinc-700 hover:text-zinc-950 font-bold underline"
          >
            Ver Detalhes →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-zinc-300 bg-zinc-50 p-3.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">PRODUÇÃO TÉCNICA</span>
            <span className="text-lg font-black text-zinc-950 block">
              {iagoStats.osCount} máquinas finalizadas
            </span>
            <span className="text-xs text-zinc-600">
              Total M.O. gerada: {fmtBRL(iagoStats.laborTotal)}
            </span>
          </div>

          <div className="border-2 border-emerald-600 bg-emerald-50/60 p-3.5">
            <span className="text-[10px] text-emerald-800 uppercase font-black block mb-1">
              SUA COMISSÃO A RECEBER (30%)
            </span>
            <span className="text-2xl font-black text-emerald-950 block">
              {fmtBRL(iagoStats.commissionTotal)}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">
              Ciclo atual ({cycleLabel})
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Visão do Especialista Mezanino Jefferson (Exclusiva: Apenas seus 50%)
  if (userCtx.effectiveRole === 'mezanino_specialist') {
    return (
      <div className="border-2 border-zinc-950 bg-white p-4 sm:p-5 text-zinc-950 space-y-3 font-mono shadow-xs">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-2.5">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">
              MINHA COMISSÃO // MEZANINO OCA & BGA
            </span>
            <h2 className="text-xs sm:text-sm font-black uppercase text-zinc-950">
              Extrato Pessoal de Produção (50% sobre Telas e Reparos)
            </h2>
          </div>
          <Link
            href="/admin/comissoes"
            className="text-xs text-zinc-700 hover:text-zinc-950 font-bold underline"
          >
            Ver Detalhes →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-zinc-300 bg-zinc-50 p-3.5">
            <span className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">PRODUÇÃO MEZANINO</span>
            <span className="text-lg font-black text-zinc-950 block">
              {jeffersonStats.osCount} ordens concluídas
            </span>
            <span className="text-xs text-zinc-600">
              Total M.O. gerada: {fmtBRL(jeffersonStats.laborTotal)}
            </span>
          </div>

          <div className="border-2 border-purple-600 bg-purple-50/60 p-3.5">
            <span className="text-[10px] text-purple-800 uppercase font-black block mb-1">
              SUA COMISSÃO A RECEBER (50%)
            </span>
            <span className="text-2xl font-black text-purple-950 block">
              {fmtBRL(jeffersonStats.commissionTotal)}
            </span>
            <span className="text-[10px] text-purple-700 font-medium">
              Ciclo atual ({cycleLabel})
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
