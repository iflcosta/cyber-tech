import Link from 'next/link';
import { UserContext } from '@/app/admin/lib/rbac';

interface DashboardTacticalBarProps {
  userCtx: UserContext;
  vpsConnected?: boolean;
}

export function DashboardTacticalBar({ userCtx, vpsConnected }: DashboardTacticalBarProps) {
  const roleLabels: Record<string, string> = {
    owner: 'Dono / Felipe',
    hardware_tech: 'Técnico Hardware / Iago',
    mezanino_specialist: 'Especialista Mezanino / Jefferson',
    stock_intern: 'Estagiário Estoque / Eduardo',
  };

  return (
    <div className="space-y-3">
      {/* 🛠️ Barra de Simulação de Desenvolvedor (Exclusiva para Iago/Desenvolvedor) */}
      {userCtx.isDeveloper && (
        <div className="border-2 border-zinc-950 bg-zinc-950 text-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono shadow-xs">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400 text-black px-2 py-0.5 font-bold uppercase tracking-wider text-[10px]">
              DEV MODE
            </span>
            <span className="text-zinc-200">
              Simulação de Permissões RBAC (Ativo:{' '}
              <strong className="text-white underline">{roleLabels[userCtx.effectiveRole]}</strong>)
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <Link
              href="/admin/dashboard"
              className={`px-2.5 py-1 text-[11px] font-bold uppercase border transition ${
                !userCtx.isSimulating
                  ? 'border-amber-400 bg-amber-400 text-black'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Master (Tudo)
            </Link>
            <Link
              href="/admin/dashboard?role=owner"
              className={`px-2.5 py-1 text-[11px] font-bold uppercase border transition ${
                userCtx.effectiveRole === 'owner' && userCtx.isSimulating
                  ? 'border-amber-400 bg-amber-400 text-black'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Felipe (Dono)
            </Link>
            <Link
              href="/admin/dashboard?role=hardware_tech"
              className={`px-2.5 py-1 text-[11px] font-bold uppercase border transition ${
                userCtx.effectiveRole === 'hardware_tech' && userCtx.isSimulating
                  ? 'border-amber-400 bg-amber-400 text-black'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Iago (Técnico 30%)
            </Link>
            <Link
              href="/admin/dashboard?role=mezanino_specialist"
              className={`px-2.5 py-1 text-[11px] font-bold uppercase border transition ${
                userCtx.effectiveRole === 'mezanino_specialist' && userCtx.isSimulating
                  ? 'border-amber-400 bg-amber-400 text-black'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Jefferson (OCA 50%)
            </Link>
            <Link
              href="/admin/dashboard?role=stock_intern"
              className={`px-2.5 py-1 text-[11px] font-bold uppercase border transition ${
                userCtx.effectiveRole === 'stock_intern' && userCtx.isSimulating
                  ? 'border-amber-400 bg-amber-400 text-black'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Eduardo (Estágio)
            </Link>
          </div>
        </div>
      )}

      {/* Barramento Tático de Ações Rápidas no Balcão */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 font-mono">
        <Link
          href="/admin/os/new"
          className="border-2 border-zinc-950 bg-white hover:bg-zinc-950 text-zinc-950 hover:text-white p-3 flex flex-col justify-between transition min-h-[58px] group shadow-xs"
        >
          <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-bold uppercase tracking-widest">+ CHECK-IN</span>
          <span className="text-xs font-black flex items-center justify-between">
            <span>Nova OS Câmera</span>
            <span className="text-zinc-400 group-hover:text-white font-bold">→</span>
          </span>
        </Link>

        <Link
          href="/admin/vender"
          className="border-2 border-zinc-950 bg-white hover:bg-zinc-950 text-zinc-950 hover:text-white p-3 flex flex-col justify-between transition min-h-[58px] group shadow-xs"
        >
          <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-bold uppercase tracking-widest">⚡ VAREJO</span>
          <span className="text-xs font-black flex items-center justify-between">
            <span>PDV Balcão</span>
            <span className="text-zinc-400 group-hover:text-white font-bold">→</span>
          </span>
        </Link>

        <Link
          href="/admin/estoque"
          className="border-2 border-zinc-950 bg-white hover:bg-zinc-950 text-zinc-950 hover:text-white p-3 flex flex-col justify-between transition min-h-[58px] group shadow-xs"
        >
          <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-bold uppercase tracking-widest">ALMOXARIFADO</span>
          <span className="text-xs font-black flex items-center justify-between">
            <span>Estoque Geral</span>
            <span className="text-zinc-400 group-hover:text-white font-bold">→</span>
          </span>
        </Link>

        <Link
          href="/admin/whatsapp"
          className="border-2 border-zinc-950 bg-white hover:bg-zinc-950 text-zinc-950 hover:text-white p-3 flex flex-col justify-between transition min-h-[58px] group shadow-xs"
        >
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 font-bold">
            <span>WHATSAPP VPS</span>
            <span className={`w-2 h-2 rounded-full ${vpsConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
          </div>
          <span className="text-xs font-black flex items-center justify-between">
            <span>{vpsConnected ? 'Conectado' : 'Cockpit VPS'}</span>
            <span className="text-zinc-400 group-hover:text-white font-bold">→</span>
          </span>
        </Link>

        {userCtx.canViewOwnCommissions || userCtx.canViewAllCommissions ? (
          <Link
            href="/admin/comissoes"
            className="col-span-2 sm:col-span-4 lg:col-span-1 border-2 border-zinc-950 bg-white hover:bg-zinc-950 text-zinc-950 hover:text-white p-3 flex flex-col justify-between transition min-h-[58px] group shadow-xs"
          >
            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-bold uppercase tracking-widest">FECHAMENTO</span>
            <span className="text-xs font-black flex items-center justify-between">
              <span>{userCtx.canViewAllCommissions ? 'Comissões Loja' : 'Minha Comissão'}</span>
              <span className="text-zinc-400 group-hover:text-white font-bold">→</span>
            </span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}
