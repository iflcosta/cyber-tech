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
      <div className="border border-zinc-800 bg-[#111114] p-4 sm:p-5 text-white space-y-4 font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-2">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">
              FECHAMENTO // SEXTA-FEIRA
            </span>
            <h2 className="text-xs sm:text-sm font-bold uppercase text-white">
              Livro-Razão de Comissões & Lucro Retido da Loja
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-zinc-400 block">{cycleLabel}</span>
            <Link
              href="/admin/comissoes"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold underline"
            >
              Abrir Extrato Completo →
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {/* Card Iago (30%) */}
          <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase text-zinc-200">Iago (30%)</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 font-bold uppercase">
                  Hardware & PC
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mb-2">
                {iagoStats.osCount} OSs executadas · M.O. {fmtBRL(iagoStats.laborTotal)}
              </p>
              <div className="mt-1">
                <span className="text-[10px] text-zinc-400 uppercase block">A PAGAR NA SEXTA</span>
                <span className="text-xl font-extrabold text-white block">
                  {fmtBRL(iagoStats.commissionTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Jefferson (50/50) */}
          <div className="border border-zinc-800 bg-zinc-950 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase text-zinc-200">Jefferson (50%)</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 font-bold uppercase">
                  Mezanino OCA
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mb-2">
                {jeffersonStats.osCount} OSs executadas · M.O. {fmtBRL(jeffersonStats.laborTotal)}
              </p>
              <div className="mt-1">
                <span className="text-[10px] text-zinc-400 uppercase block">A PAGAR NA SEXTA</span>
                <span className="text-xl font-extrabold text-white block">
                  {fmtBRL(jeffersonStats.commissionTotal)}
                </span>
              </div>
            </div>
          </div>

          {/* Card Lucro Retido da Loja (Felipe) */}
          <div className="border border-emerald-500/30 bg-emerald-950/20 p-3.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase text-emerald-300">Lucro Retido Loja</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 font-bold uppercase">
                  Felipe / Caixa
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 mb-2">
                Margem líquida retida para custos fixos e capital de giro.
              </p>
              <div className="mt-1">
                <span className="text-[10px] text-emerald-400 uppercase block">MARGEM RETIDA</span>
                <span className="text-xl font-extrabold text-emerald-300 block">
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
      <div className="border border-zinc-800 bg-[#111114] p-4 sm:p-5 text-white space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">
              MINHA COMISSÃO // FECHAMENTO SEXTA-FEIRA
            </span>
            <h2 className="text-xs sm:text-sm font-bold uppercase text-white">
              Extrato Pessoal de Produção (30% sobre Mão de Obra)
            </h2>
          </div>
          <Link
            href="/admin/comissoes"
            className="text-xs text-white hover:text-zinc-300 underline"
          >
            Ver Detalhes →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-3.5">
            <span className="text-[10px] text-zinc-400 uppercase block mb-1">PRODUÇÃO TÉCNICA</span>
            <span className="text-lg font-bold text-white block">
              {iagoStats.osCount} máquinas finalizadas
            </span>
            <span className="text-xs text-zinc-400">
              Total M.O. gerada: {fmtBRL(iagoStats.laborTotal)}
            </span>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-3.5">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">
              SUA COMISSÃO A RECEBER (30%)
            </span>
            <span className="text-2xl font-extrabold text-emerald-300 block">
              {fmtBRL(iagoStats.commissionTotal)}
            </span>
            <span className="text-[10px] text-zinc-400">
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
      <div className="border border-zinc-800 bg-[#111114] p-4 sm:p-5 text-white space-y-3 font-mono">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
          <div>
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest block">
              MINHA COMISSÃO // MEZANINO OCA & BGA
            </span>
            <h2 className="text-xs sm:text-sm font-bold uppercase text-white">
              Extrato Pessoal de Produção (50% sobre Telas e Reparos)
            </h2>
          </div>
          <Link
            href="/admin/comissoes"
            className="text-xs text-white hover:text-zinc-300 underline"
          >
            Ver Detalhes →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="border border-zinc-800 bg-zinc-950 p-3.5">
            <span className="text-[10px] text-zinc-400 uppercase block mb-1">PRODUÇÃO MEZANINO</span>
            <span className="text-lg font-bold text-white block">
              {jeffersonStats.osCount} ordens concluídas
            </span>
            <span className="text-xs text-zinc-400">
              Total M.O. gerada: {fmtBRL(jeffersonStats.laborTotal)}
            </span>
          </div>

          <div className="border border-zinc-800 bg-zinc-950 p-3.5">
            <span className="text-[10px] text-indigo-400 uppercase font-bold block mb-1">
              SUA COMISSÃO A RECEBER (50%)
            </span>
            <span className="text-2xl font-extrabold text-indigo-300 block">
              {fmtBRL(jeffersonStats.commissionTotal)}
            </span>
            <span className="text-[10px] text-zinc-400">
              Ciclo atual ({cycleLabel})
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
