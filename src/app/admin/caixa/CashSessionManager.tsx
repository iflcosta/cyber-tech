'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { formatDateTimeBR, formatTimeBR } from '@/app/admin/lib/datetime';

export type CashSession = {
  id: string;
  session_number: number;
  opened_by: string;
  closed_by: string | null;
  opened_at: string;
  closed_at: string | null;
  initial_cash: number;
  total_cash_in: number;
  total_cash_out: number;
  expected_cash: number;
  declared_cash: number | null;
  cash_difference: number | null;
  status: 'open' | 'closed';
  notes: string | null;
  opener?: { full_name: string } | null;
  closer?: { full_name: string } | null;
};

export type CashEntry = {
  id: string;
  session_id: string;
  entry_type: 'initial' | 'in_sale' | 'in_os' | 'out_bleed' | 'in_reinforce' | 'manual_adjustment';
  amount: number;
  description: string;
  author_id: string;
  created_at: string;
  author?: { full_name: string } | null;
};

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseBRL(v: string): number {
  if (!v.trim()) return 0;
  const normalized = v.includes(',')
    ? v.replace(/\./g, '').replace(',', '.')
    : v;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

const COMMON_BLEEDS = [
  'Pagamento de Motoboy / Entrega',
  'Água mineral / Galão',
  'Produtos de limpeza da loja',
  'Lanche / Alimentação equipe',
  'Compra emergencial de peça/conector no vizinho',
  'Sangria para o cofre da gerência',
];

export function CashSessionManager({
  activeSession,
  activeEntries,
  recentSessions,
  currentUserId,
  currentUserName,
  isOwnerOrManager,
}: {
  activeSession: CashSession | null;
  activeEntries: CashEntry[];
  recentSessions: CashSession[];
  currentUserId: string;
  currentUserName: string;
  isOwnerOrManager: boolean;
}) {
  const router = useRouter();

  // Estados de Abertura
  const [openTrocoStr, setOpenTrocoStr] = useState('150,00');
  const [openingNotes, setOpeningNotes] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  // Estados de Movimentação (Sangria / Suprimento)
  const [showEntryModal, setShowEntryModal] = useState<'bleed' | 'reinforce' | null>(null);
  const [entryAmountStr, setEntryAmountStr] = useState('');
  const [entryDesc, setEntryDesc] = useState('');
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Estados de Fechamento de Caixa
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [declaredCashStr, setDeclaredCashStr] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closeResult, setCloseResult] = useState<{
    declared: number;
    expected: number;
    diff: number;
  } | null>(null);

  // 1. ABRIR CAIXA
  async function handleOpenCash(e: React.FormEvent) {
    e.preventDefault();
    const initial = parseBRL(openTrocoStr);
    setIsOpening(true);

    try {
      const supabase = createCRMBrowserClient();
      const { data: session, error: err } = await supabase
        .from('cash_sessions')
        .insert({
          opened_by: currentUserId,
          initial_cash: initial,
          expected_cash: initial,
          status: 'open',
          notes: openingNotes.trim() || null,
        })
        .select()
        .single();

      if (err) throw err;

      // Cria a entrada de fundo de troco inicial
      if (initial > 0) {
        await supabase.from('cash_entries').insert({
          session_id: session.id,
          entry_type: 'initial',
          amount: initial,
          description: `Fundo de troco inicial de abertura (${currentUserName})`,
          author_id: currentUserId,
        });
      }

      router.refresh();
    } catch (err) {
      window.alert(`Erro ao abrir caixa: ${(err as Error).message}`);
    } finally {
      setIsOpening(false);
    }
  }

  // 2. REGISTRAR SANGRIA OU SUPRIMENTO
  async function handleSubmitEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSession) return;
    const amount = parseBRL(entryAmountStr);
    if (amount <= 0) {
      setEntryError('O valor deve ser maior que zero.');
      return;
    }
    if (!entryDesc.trim()) {
      setEntryError('Informe o motivo ou descrição da movimentação.');
      return;
    }

    setIsSubmittingEntry(true);
    setEntryError(null);

    try {
      const supabase = createCRMBrowserClient();
      const entryType = showEntryModal === 'bleed' ? 'out_bleed' : 'in_reinforce';
      const prefix = showEntryModal === 'bleed' ? 'Sangria: ' : 'Suprimento: ';

      const { error: err } = await supabase.from('cash_entries').insert({
        session_id: activeSession.id,
        entry_type: entryType,
        amount,
        description: `${prefix}${entryDesc.trim()}`,
        author_id: currentUserId,
      });

      if (err) throw err;

      setShowEntryModal(null);
      setEntryAmountStr('');
      setEntryDesc('');
      router.refresh();
    } catch (err) {
      setEntryError(`Erro ao registrar: ${(err as Error).message}`);
    } finally {
      setIsSubmittingEntry(false);
    }
  }

  // 3. FECHAR CAIXA (CONFERÊNCIA CEGA)
  async function handleCloseCash(e: React.FormEvent) {
    e.preventDefault();
    if (!activeSession) return;
    const declared = parseBRL(declaredCashStr);
    const expected = Number(activeSession.expected_cash || 0);
    const diff = declared - expected;

    setIsClosing(true);

    try {
      const supabase = createCRMBrowserClient();
      const { error: err } = await supabase
        .from('cash_sessions')
        .update({
          closed_by: currentUserId,
          closed_at: new Date().toISOString(),
          declared_cash: declared,
          cash_difference: diff,
          status: 'closed',
          notes: closeNotes.trim() || activeSession.notes || null,
        })
        .eq('id', activeSession.id);

      if (err) throw err;

      setCloseResult({ declared, expected, diff });
      router.refresh();
    } catch (err) {
      window.alert(`Erro ao fechar caixa: ${(err as Error).message}`);
    } finally {
      setIsClosing(false);
    }
  }

  return (
    <div className="space-y-6 font-sans">
      {/* SE O CAIXA ESTIVER FECHADO: TELA DE ABERTURA MATINAL */}
      {!activeSession ? (
        <div className="border-2 border-zinc-950 bg-white p-6 shadow-xs max-w-xl mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500" />
            <h2 className="text-xl font-black uppercase text-zinc-950">Caixa Fechado</h2>
          </div>
          <p className="mt-1 font-mono text-xs text-zinc-600">
            Nenhuma sessão de caixa está aberta no momento. Abra o caixa para começar a registrar vendas no balcão e saídas em dinheiro.
          </p>

          <form onSubmit={handleOpenCash} className="mt-5 space-y-4 font-mono text-xs">
            <div>
              <label className="block font-bold uppercase text-zinc-800 mb-1">
                Fundo de Troco Inicial em Dinheiro (R$):
              </label>
              <input
                type="text"
                value={openTrocoStr}
                onChange={(e) => setOpenTrocoStr(e.target.value)}
                placeholder="Ex: 150,00"
                className="w-full border-2 border-zinc-950 bg-zinc-50 p-3 text-base font-black text-zinc-950 focus:bg-white focus:outline-none"
                required
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {['50,00', '100,00', '150,00', '200,00'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setOpenTrocoStr(val)}
                    className="border border-zinc-300 bg-white px-2.5 py-1 text-zinc-700 font-bold hover:bg-zinc-100"
                  >
                    R$ {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase text-zinc-700 mb-1">
                Observações de Abertura (opcional):
              </label>
              <input
                type="text"
                value={openingNotes}
                onChange={(e) => setOpeningNotes(e.target.value)}
                placeholder="Ex: Cédulas e moedas separadas para troco..."
                className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isOpening}
                className="w-full bg-zinc-950 p-3 text-sm font-black uppercase text-white hover:bg-zinc-800 transition disabled:opacity-50"
              >
                {isOpening ? 'Abrindo Caixa...' : '🔓 Abrir Caixa do Dia'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* SE O CAIXA ESTIVER ABERTO: PAINEL DE CONTROLE DE CAIXA */
        <div className="space-y-6">
          {/* BARRA SUPERIOR DO CAIXA ABERTO */}
          <div className="border-2 border-zinc-950 bg-white p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="bg-zinc-950 text-white font-mono text-xs font-bold px-2 py-0.5 uppercase tracking-widest">
                    CAIXA #{activeSession.session_number} ABERTO
                  </span>
                  <span className="font-mono text-xs text-zinc-500">
                    Aberto às {formatTimeBR(activeSession.opened_at)} ({formatDateTimeBR(activeSession.opened_at)})
                  </span>
                </div>
                <h1 className="mt-1 text-2xl font-black uppercase tracking-tight text-zinc-950">
                  Frente de Caixa // Operador: {activeSession.opener?.full_name || currentUserName}
                </h1>
              </div>

              {/* BOTÕES DE AÇÃO RÁPIDA */}
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => setShowEntryModal('bleed')}
                  className="border-2 border-red-600 bg-red-50 text-red-950 px-3.5 py-2 font-bold uppercase hover:bg-red-100 transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>💸</span> + Registrar Sangria (Saída)
                </button>
                <button
                  type="button"
                  onClick={() => setShowEntryModal('reinforce')}
                  className="border-2 border-blue-600 bg-blue-50 text-blue-950 px-3.5 py-2 font-bold uppercase hover:bg-blue-100 transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>📥</span> + Suprimento (Entrada)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCloseResult(null);
                    setShowCloseModal(true);
                  }}
                  className="border-2 border-zinc-950 bg-zinc-950 text-white px-3.5 py-2 font-black uppercase hover:bg-zinc-800 transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>🔒</span> Fechar Caixa
                </button>
              </div>
            </div>
          </div>

          {/* 4 CARDS DE KPI DE TESOURARIA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-2 border-zinc-950 bg-zinc-950 gap-[1px]">
            <div className="bg-white p-4">
              <span className="font-mono text-[11px] font-bold uppercase text-zinc-500">Fundo de Troco Inicial</span>
              <p className="mt-2 text-2xl font-black font-mono text-zinc-950">{fmtBRL(activeSession.initial_cash)}</p>
              <p className="mt-1 font-mono text-xs text-zinc-400">Abertura da manhã</p>
            </div>

            <div className="bg-white p-4">
              <span className="font-mono text-[11px] font-bold uppercase text-emerald-700">Entradas em Dinheiro (+)</span>
              <p className="mt-2 text-2xl font-black font-mono text-emerald-950">+{fmtBRL(activeSession.total_cash_in)}</p>
              <p className="mt-1 font-mono text-xs text-zinc-400">Vendas PDV + OSs pagas</p>
            </div>

            <div className="bg-white p-4">
              <span className="font-mono text-[11px] font-bold uppercase text-red-700">Sangrias / Saídas (-)</span>
              <p className="mt-2 text-2xl font-black font-mono text-red-950">-{fmtBRL(activeSession.total_cash_out)}</p>
              <p className="mt-1 font-mono text-xs text-zinc-400">Despesas balcão / cofre</p>
            </div>

            <div className="bg-white p-4 ring-2 ring-zinc-950 ring-inset">
              <span className="font-mono text-[11px] font-black uppercase text-zinc-950">Saldo Esperado em Gaveta</span>
              <p className="mt-2 text-2xl font-black font-mono text-zinc-950">{fmtBRL(activeSession.expected_cash)}</p>
              <p className="mt-1 font-mono text-xs text-zinc-500">Troco + Entradas - Sangrias</p>
            </div>
          </div>

          {/* EXTRATO CRONOLÓGICO DE MOVIMENTAÇÕES DO DIA */}
          <div className="border-2 border-zinc-950 bg-white shadow-xs">
            <div className="border-b-2 border-zinc-950 p-4 bg-zinc-50 flex items-center justify-between">
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
                Extrato Cronológico de Movimentações ({activeEntries.length} lançamentos)
              </h3>
              <span className="font-mono text-xs text-zinc-500">Sessão Ativa</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-xs font-mono">
                <thead className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Horário</th>
                    <th className="px-4 py-2.5">Tipo</th>
                    <th className="px-4 py-2.5">Descrição / Motivo</th>
                    <th className="px-4 py-2.5">Operador</th>
                    <th className="px-4 py-2.5 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 bg-white">
                  {activeEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-500">
                        Nenhuma movimentação registrada nesta sessão ainda.
                      </td>
                    </tr>
                  ) : (
                    activeEntries.map((e) => {
                      const isOut = e.entry_type === 'out_bleed';
                      const isIn = e.entry_type === 'in_sale' || e.entry_type === 'in_os' || e.entry_type === 'in_reinforce';
                      const isInit = e.entry_type === 'initial';

                      return (
                        <tr key={e.id} className="hover:bg-zinc-50">
                          <td className="px-4 py-2.5 text-zinc-500 whitespace-nowrap">
                            {formatTimeBR(e.created_at)}
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                              isOut ? 'bg-red-100 text-red-800 border border-red-300' :
                              isIn ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              'bg-zinc-100 text-zinc-800 border border-zinc-300'
                            }`}>
                              {isOut ? 'Sangria (-)' : isIn ? 'Entrada (+)' : 'Troco Inicial'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-zinc-950">
                            {e.description}
                          </td>
                          <td className="px-4 py-2.5 text-zinc-600">
                            {e.author?.full_name || 'Operador'}
                          </td>
                          <td className={`px-4 py-2.5 text-right font-black whitespace-nowrap ${
                            isOut ? 'text-red-700' : isIn ? 'text-emerald-700' : 'text-zinc-950'
                          }`}>
                            {isOut ? `- ${fmtBRL(e.amount)}` : `+ ${fmtBRL(e.amount)}`}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* HISTÓRICO DE SESSÕES ANTERIORES FECHADAS */}
      {recentSessions.length > 0 && (
        <div className="border-2 border-zinc-950 bg-white p-4 shadow-xs space-y-3">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
            Histórico de Sessões Anteriores Fechadas
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-200 text-left text-xs font-mono">
              <thead className="bg-zinc-100 text-zinc-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-3 py-2">Sessão</th>
                  <th className="px-3 py-2">Abertura</th>
                  <th className="px-3 py-2">Fechamento</th>
                  <th className="px-3 py-2">Operador</th>
                  <th className="px-3 py-2 text-right">Troco Inicial</th>
                  <th className="px-3 py-2 text-right">Esperado</th>
                  <th className="px-3 py-2 text-right">Declarado</th>
                  <th className="px-3 py-2 text-right">Diferença</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {recentSessions.map((s) => {
                  const diff = Number(s.cash_difference || 0);
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50">
                      <td className="px-3 py-2 font-bold text-zinc-950">#{s.session_number}</td>
                      <td className="px-3 py-2 text-zinc-500">{formatDateTimeBR(s.opened_at)}</td>
                      <td className="px-3 py-2 text-zinc-500">{s.closed_at ? formatDateTimeBR(s.closed_at) : '—'}</td>
                      <td className="px-3 py-2">{s.opener?.full_name || '—'}</td>
                      <td className="px-3 py-2 text-right">{fmtBRL(s.initial_cash)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{fmtBRL(s.expected_cash)}</td>
                      <td className="px-3 py-2 text-right font-bold">{s.declared_cash !== null ? fmtBRL(s.declared_cash) : '—'}</td>
                      <td className={`px-3 py-2 text-right font-black ${
                        diff === 0 ? 'text-zinc-600' : diff > 0 ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        {diff === 0 ? 'R$ 0,00 (Exato)' : diff > 0 ? `+ ${fmtBRL(diff)} (Sobra)` : `${fmtBRL(diff)} (Quebra)`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE SANGRIA OU SUPRIMENTO */}
      {showEntryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md border-2 border-zinc-950 bg-white p-5 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="font-bold uppercase text-zinc-950 text-sm flex items-center gap-1.5">
                {showEntryModal === 'bleed' ? '💸 Registrar Sangria (Retirada em Dinheiro)' : '📥 Registrar Suprimento (Entrada de Troco)'}
              </h3>
              <button
                type="button"
                onClick={() => setShowEntryModal(null)}
                className="text-zinc-500 hover:text-black font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {entryError && (
              <div className="mt-3 border border-red-300 bg-red-50 p-2 text-red-800">
                {entryError}
              </div>
            )}

            <form onSubmit={handleSubmitEntry} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Valor em Dinheiro (R$):
                </label>
                <input
                  type="text"
                  value={entryAmountStr}
                  onChange={(e) => setEntryAmountStr(e.target.value)}
                  placeholder="Ex: 35,00"
                  className="w-full border-2 border-zinc-950 bg-zinc-50 p-2 text-base font-black text-zinc-950 focus:bg-white focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                  Motivo / Descrição:
                </label>
                <input
                  type="text"
                  value={entryDesc}
                  onChange={(e) => setEntryDesc(e.target.value)}
                  placeholder="Ex: Água mineral, motoboy, compra de peça..."
                  className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                  required
                />
                {showEntryModal === 'bleed' && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {COMMON_BLEEDS.slice(0, 4).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setEntryDesc(m)}
                        className="text-[10px] bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 hover:bg-zinc-200 text-zinc-700"
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(null)}
                  className="border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 font-bold hover:bg-zinc-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEntry}
                  className={`px-4 py-1.5 font-bold uppercase text-white disabled:opacity-50 ${
                    showEntryModal === 'bleed' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmittingEntry ? 'Registrando...' : showEntryModal === 'bleed' ? 'Confirmar Sangria' : 'Confirmar Suprimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE FECHAMENTO NOTURNO (CONFERÊNCIA CEGA) */}
      {showCloseModal && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg border-2 border-zinc-950 bg-white p-5 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
              <h3 className="font-bold uppercase text-zinc-950 text-sm flex items-center gap-1.5">
                <span>🔒</span> Fechamento de Caixa // Sessão #{activeSession.session_number}
              </h3>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="text-zinc-500 hover:text-black font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {!closeResult ? (
              <form onSubmit={handleCloseCash} className="mt-4 space-y-4">
                <div className="border border-amber-300 bg-amber-50 p-3 text-amber-900">
                  <p className="font-bold uppercase text-[11px]">Conferência Cega de Notas e Moedas:</p>
                  <p className="mt-0.5 text-xs">
                    Conte todo o dinheiro físico presente na gaveta e digite o valor total abaixo. O sistema comparará automaticamente com os lançamentos do dia.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-800 mb-1">
                    Valor Físico Contado na Gaveta (R$):
                  </label>
                  <input
                    type="text"
                    value={declaredCashStr}
                    onChange={(e) => setDeclaredCashStr(e.target.value)}
                    placeholder="Ex: 485,00"
                    className="w-full border-2 border-zinc-950 bg-zinc-50 p-3 text-lg font-black text-zinc-950 focus:bg-white focus:outline-none"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-700 mb-1">
                    Observações de Fechamento (opcional):
                  </label>
                  <input
                    type="text"
                    value={closeNotes}
                    onChange={(e) => setCloseNotes(e.target.value)}
                    placeholder="Ex: Fechamento normal sem ocorrências..."
                    className="w-full border border-zinc-300 bg-white p-2 text-xs focus:border-black focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200">
                  <button
                    type="button"
                    onClick={() => setShowCloseModal(false)}
                    className="border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 font-bold hover:bg-zinc-100"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isClosing}
                    className="bg-zinc-950 px-4 py-1.5 text-white font-bold uppercase hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isClosing ? 'Fechando Caixa...' : 'Confirmar e Encerrar Caixa'}
                  </button>
                </div>
              </form>
            ) : (
              /* RESULTADO DA CONFERÊNCIA */
              <div className="mt-4 space-y-4">
                <div className={`p-4 border-2 ${
                  closeResult.diff === 0 ? 'border-zinc-950 bg-zinc-50' :
                  closeResult.diff > 0 ? 'border-emerald-600 bg-emerald-50' : 'border-red-600 bg-red-50'
                }`}>
                  <p className="font-bold uppercase text-sm">
                    {closeResult.diff === 0 ? '✓ Caixa Fechado com Sucesso (100% Exato!)' :
                     closeResult.diff > 0 ? '⚠️ Caixa Fechado com SOBRA de Dinheiro' : '⚠️ Caixa Fechado com QUEBRA (Falta de Dinheiro)'}
                  </p>

                  <div className="mt-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Saldo Esperado pelo Sistema:</span>
                      <strong className="font-mono">{fmtBRL(closeResult.expected)}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-600">Valor Declarado pelo Operador:</span>
                      <strong className="font-mono">{fmtBRL(closeResult.declared)}</strong>
                    </div>
                    <div className="flex justify-between border-t border-zinc-300 pt-1 text-sm font-black">
                      <span>Diferença Apurada:</span>
                      <span className={closeResult.diff >= 0 ? 'text-emerald-900' : 'text-red-900'}>
                        {closeResult.diff === 0 ? 'R$ 0,00' : fmtBRL(closeResult.diff)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCloseModal(false);
                      setCloseResult(null);
                      router.refresh();
                    }}
                    className="bg-zinc-950 px-4 py-2 text-white font-bold uppercase hover:bg-zinc-800"
                  >
                    OK / Concluir
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
