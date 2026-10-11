'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';

export function TopClaimOSBanner({
  osId,
  technicianId,
  status,
  currentUserId,
  currentUserName,
  currentUserRole,
}: {
  osId: string;
  technicianId: string | null;
  status: string;
  currentUserId: string;
  currentUserName: string;
  currentUserRole?: string | null;
}) {
  const router = useRouter();
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se já tem técnico atribuído ou a OS já foi entregue/cancelada, não exibe
  if (technicianId || ['delivered', 'cancelled'].includes(status)) {
    return null;
  }

  const isReceptionist = currentUserRole === 'receptionist';

  async function handleClaim() {
    if (claiming) return;
    setClaiming(true);
    setError(null);

    try {
      const supabase = createCRMBrowserClient();
      const { error: updateErr } = await supabase
        .from('service_orders')
        .update({ technician_id: currentUserId })
        .eq('id', osId);

      if (updateErr) throw updateErr;

      await supabase.from('service_order_events').insert({
        service_order_id: osId,
        event_type: 'assigned',
        from_value: 'Sem técnico (Fila da Bancada)',
        to_value: currentUserName,
        note: `OS puxada para bancada por ${currentUserName} com 1 clique (Início de Diagnóstico).`,
        author_id: currentUserId,
      });

      router.refresh();
    } catch (err) {
      console.error('Erro ao puxar OS para a bancada:', err);
      setError((err as Error).message || 'Falha ao assumir a ordem de serviço.');
      setClaiming(false);
    }
  }

  return (
    <div className="border-2 border-amber-500 bg-amber-50/90 text-amber-950 p-4 sm:p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-black uppercase tracking-wider bg-amber-500 text-black px-2 py-0.5">
              ⚡ FILA DA BANCADA · SEM TÉCNICO ATRIBUÍDO
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-zinc-950 font-mono">
            Aparelho Aguardando Diagnóstico Técnico
          </h2>
          <p className="text-xs text-amber-900 leading-relaxed max-w-2xl">
            Esta ordem de serviço foi registrada no balcão e aguarda um técnico da bancada assumir o equipamento para inspecionar, testar e passar o orçamento pericial ao cliente.
          </p>
        </div>

        <div className="w-full sm:w-auto shrink-0">
          {isReceptionist ? (
            <div className="border border-amber-300 bg-amber-100/70 px-3 py-2 text-center font-mono text-xs font-semibold text-amber-900">
              📋 Registrado no Balcão · Aguardando bancada escanear QR Code
            </div>
          ) : (
            <button
              type="button"
              onClick={handleClaim}
              disabled={claiming}
              className="w-full sm:w-auto bg-zinc-950 hover:bg-black text-white font-mono text-xs sm:text-sm font-bold uppercase tracking-wider px-5 py-3 border-2 border-zinc-950 flex items-center justify-center gap-2 cursor-pointer transition shadow-xs disabled:opacity-50 min-h-[48px]"
            >
              <span>{claiming ? '⚡ Assumindo na Bancada…' : `⚡ Puxar para Minha Bancada (${currentUserName.split(' ')[0]})`}</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-300 text-red-900 font-mono text-xs font-bold">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
