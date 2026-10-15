'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createCRMBrowserClient } from '@/app/admin/lib/supabase/client';
import { PAYMENT_METHODS, type PaymentMethodValue } from '@/app/admin/types/database';
import { PIX_CONFIG } from '@/app/admin/lib/pix';

export type ReceivableItem = {
  id: string;
  os_number: string | null;
  short_id: string;
  status: string;
  equipment_type: string;
  equipment_brand: string | null;
  equipment_model: string | null;
  reported_defect: string | null;
  customer_id: string;
  customer_name: string;
  customer_phone: string | null;
  labor_cost: number;
  parts_total: number;
  grand_total: number;
  total_paid: number;
  remaining: number;
  days_waiting: number;
  delivered_at: string | null;
  updated_at: string;
  created_at: string;
};

type ActiveCashSession = {
  id: string;
  opened_at: string;
  operator_name?: string;
} | null;

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function cleanPhone(phone: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }
  return digits;
}

export function ReceivablesManager({
  receivables,
  currentUserId,
  currentUserName,
  activeCashSession,
}: {
  receivables: ReceivableItem[];
  currentUserId: string;
  currentUserName: string;
  activeCashSession: ActiveCashSession;
}) {
  const router = useRouter();

  // Filtros
  const [activeTab, setActiveTab] = useState<'all' | 'fiado' | 'ready' | 'bench'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'highest' | 'oldest' | 'newest'>('highest');

  // Modal de Quitação
  const [payModalItem, setPayModalItem] = useState<ReceivableItem | null>(null);
  const [payAmountStr, setPayAmountStr] = useState('');
  const [payMethod, setPayMethod] = useState<PaymentMethodValue>('pix');
  const [addToCash, setAddToCash] = useState(true);
  const [payNotes, setPayNotes] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Modal de WhatsApp Preview
  const [waModalItem, setWaModalItem] = useState<ReceivableItem | null>(null);
  const [waCustomText, setWaCustomText] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);

  // KPIs
  const totalReceivable = useMemo(
    () => receivables.reduce((acc, r) => acc + r.remaining, 0),
    [receivables],
  );

  const fiadoItems = useMemo(
    () => receivables.filter((r) => r.status === 'delivered'),
    [receivables],
  );
  const totalFiado = useMemo(
    () => fiadoItems.reduce((acc, r) => acc + r.remaining, 0),
    [fiadoItems],
  );

  const readyItems = useMemo(
    () => receivables.filter((r) => r.status === 'ready'),
    [receivables],
  );
  const totalReady = useMemo(
    () => readyItems.reduce((acc, r) => acc + r.remaining, 0),
    [readyItems],
  );

  const benchItems = useMemo(
    () => receivables.filter((r) => r.status !== 'delivered' && r.status !== 'ready'),
    [receivables],
  );
  const totalBench = useMemo(
    () => benchItems.reduce((acc, r) => acc + r.remaining, 0),
    [benchItems],
  );

  // Filtragem e ordenação da lista
  const filteredItems = useMemo(() => {
    let list = receivables;

    if (activeTab === 'fiado') {
      list = list.filter((r) => r.status === 'delivered');
    } else if (activeTab === 'ready') {
      list = list.filter((r) => r.status === 'ready');
    } else if (activeTab === 'bench') {
      list = list.filter((r) => r.status !== 'delivered' && r.status !== 'ready');
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((r) => {
        const osNum = (r.os_number || '').toLowerCase();
        const shortId = (r.short_id || '').toLowerCase();
        const custName = (r.customer_name || '').toLowerCase();
        const custPhone = (r.customer_phone || '').replace(/\D/g, '');
        const model = `${r.equipment_brand || ''} ${r.equipment_model || ''}`.toLowerCase();
        return (
          osNum.includes(q) ||
          shortId.includes(q) ||
          custName.includes(q) ||
          custPhone.includes(q) ||
          model.includes(q)
        );
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'highest') return b.remaining - a.remaining;
      if (sortBy === 'oldest') return b.days_waiting - a.days_waiting;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [receivables, activeTab, searchTerm, sortBy]);

  // Abertura do modal de Quitação
  function openPayModal(item: ReceivableItem) {
    setPayModalItem(item);
    setPayAmountStr(item.remaining.toFixed(2).replace('.', ','));
    setPayMethod('pix');
    setAddToCash(Boolean(activeCashSession));
    setPayNotes('');
    setPayError(null);
  }

  async function handleConfirmPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payModalItem) return;

    const num = Number(payAmountStr.replace(/\./g, '').replace(',', '.'));
    if (!Number.isFinite(num) || num <= 0) {
      setPayError('Informe um valor de pagamento válido maior que zero.');
      return;
    }

    setIsSubmittingPay(true);
    setPayError(null);

    try {
      const supabase = createCRMBrowserClient();

      // 1. Grava o pagamento da OS
      const { error: payErr } = await supabase.from('service_order_payments').insert({
        service_order_id: payModalItem.id,
        amount: num,
        payment_method: payMethod,
        author_id: currentUserId,
      } as never);
      if (payErr) throw payErr;

      // 2. Se for em dinheiro e houver caixa aberto, lança no Caixa
      if (addToCash && activeCashSession && payMethod === 'cash') {
        const desc = `Recebimento OS #${payModalItem.short_id} (${payModalItem.customer_name}) - Baixa em A Receber`;
        await supabase.from('cash_entries').insert({
          session_id: activeCashSession.id,
          entry_type: 'in_os',
          amount: num,
          description: desc,
          author_id: currentUserId,
        });
      }

      setPayModalItem(null);
      router.refresh();
    } catch (err) {
      setPayError((err as Error).message);
    } finally {
      setIsSubmittingPay(false);
    }
  }

  // Abertura do modal de WhatsApp
  function openWaModal(item: ReceivableItem) {
    const pixKey = PIX_CONFIG.key || '11966646190';
    const osIdent = item.short_id || item.os_number || 'da sua OS';
    const equip = [item.equipment_brand, item.equipment_model].filter(Boolean).join(' ') || item.equipment_type;

    let defaultMsg = `Olá ${item.customer_name}, tudo bem? Aqui é da Cyber Tech Informática.\n\n`;
    if (item.status === 'delivered') {
      defaultMsg += `Passando para verificar sobre o saldo em aberto de ${fmtBRL(item.remaining)} referente ao reparo do seu ${equip} (OS #${osIdent}).\n\n`;
    } else if (item.status === 'ready') {
      defaultMsg += `Seu ${equip} (OS #${osIdent}) já está pronto para retirada em nossa loja! O valor restante a acertar na entrega é de ${fmtBRL(item.remaining)}.\n\n`;
    } else {
      defaultMsg += `Atualização referente ao seu ${equip} (OS #${osIdent}): o saldo pendente do serviço é de ${fmtBRL(item.remaining)}.\n\n`;
    }

    defaultMsg += `Caso queira antecipar ou acertar via PIX, nossa chave é:\n🔑 ${pixKey} (Cyber Tech Informática)\n\nQualquer dúvida estamos à disposição!`;

    setWaModalItem(item);
    setWaCustomText(defaultMsg);
  }

  function handleSendWhatsApp() {
    if (!waModalItem || !waModalItem.customer_phone) return;
    const clean = cleanPhone(waModalItem.customer_phone);
    if (!clean) {
      alert('Telefone do cliente inválido ou não cadastrado.');
      return;
    }
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(waCustomText)}`;
    window.open(url, '_blank');
    setWaModalItem(null);
  }

  function copyPixKey() {
    const pixKey = PIX_CONFIG.key || '11966646190';
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  }

  return (
    <div className="space-y-6">
      {/* HEADER & TITULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-zinc-950 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="font-mono text-2xl font-black uppercase tracking-tight text-zinc-950">
              Contas a Receber & Fiado
            </h1>
          </div>
          <p className="font-mono text-xs text-zinc-600 mt-1">
            Controle de créditos em aberto, OSs entregues a prazo e cobrança rápida no WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeCashSession ? (
            <span className="border-2 border-emerald-600 bg-emerald-50 px-2.5 py-1 font-mono text-[11px] font-bold text-emerald-900 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              Caixa Aberto (Sessão Ativa)
            </span>
          ) : (
            <Link
              href="/admin/caixa"
              className="border-2 border-amber-600 bg-amber-50 px-2.5 py-1 font-mono text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition"
            >
              ⚠️ Caixa Fechado (Abrir Caixa)
            </Link>
          )}
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total a Receber */}
        <div className="border-2 border-zinc-950 bg-white p-4 shadow-sm">
          <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Total Geral a Receber
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="font-mono text-2xl font-black text-zinc-950">
              {fmtBRL(totalReceivable)}
            </p>
            <span className="font-mono text-xs font-bold text-zinc-500">
              {receivables.length} OSs
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-zinc-600">
            Saldo acumulado pendente de quitação
          </p>
        </div>

        {/* Fiado Real - Entregue */}
        <div className="border-2 border-red-600 bg-red-50/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-red-700">
              🚨 Fiado Real (Aparelhos Entregues)
            </span>
            <span className="bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5">
              Risco Alto
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="font-mono text-2xl font-black text-red-950">
              {fmtBRL(totalFiado)}
            </p>
            <span className="font-mono text-xs font-bold text-red-800">
              {fiadoItems.length} OSs
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-red-700">
            Aparelho já foi levado pelo cliente sem pagar
          </p>
        </div>

        {/* Prontos para Retirada */}
        <div className="border-2 border-blue-600 bg-blue-50/40 p-4 shadow-sm">
          <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-blue-800">
            📦 Prontos na Loja (Aguardando Retirada)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="font-mono text-2xl font-black text-blue-950">
              {fmtBRL(totalReady)}
            </p>
            <span className="font-mono text-xs font-bold text-blue-800">
              {readyItems.length} OSs
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-blue-700">
            Cliente acerta no balcão ao retirar aparelho
          </p>
        </div>

        {/* Em Bancada / Manutenção */}
        <div className="border-2 border-zinc-950 bg-white p-4 shadow-sm">
          <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            🔧 Em Bancada / Manutenção
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="font-mono text-2xl font-black text-zinc-950">
              {fmtBRL(totalBench)}
            </p>
            <span className="font-mono text-xs font-bold text-zinc-500">
              {benchItems.length} OSs
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-zinc-600">
            OSs abertas com adiantamentos pendentes
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS E BUSCA */}
      <div className="border-2 border-zinc-950 bg-white p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* TABS RÁPIDAS */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              Todos ({receivables.length})
            </button>
            <button
              onClick={() => setActiveTab('fiado')}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'fiado'
                  ? 'bg-red-600 text-white'
                  : 'border border-red-300 bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              🚨 Fiado Entregue ({fiadoItems.length})
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'ready'
                  ? 'bg-blue-600 text-white'
                  : 'border border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
              }`}
            >
              📦 Prontos p/ Retirada ({readyItems.length})
            </button>
            <button
              onClick={() => setActiveTab('bench')}
              className={`px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                activeTab === 'bench'
                  ? 'bg-zinc-950 text-white'
                  : 'border border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              🔧 Bancada ({benchItems.length})
            </button>
          </div>

          {/* ORDENAÇÃO */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-zinc-500 uppercase">
              Ordenar por:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-zinc-300 bg-white px-2 py-1 font-mono text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
            >
              <option value="highest">Maior Valor Devedor</option>
              <option value="oldest">Mais Antigo / Dias Atraso</option>
              <option value="newest">Mais Recentes</option>
            </select>
          </div>
        </div>

        {/* INPUT DE BUSCA */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, telefone, número da OS ou modelo de aparelho..."
            className="w-full border border-zinc-300 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white focus:outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-2 font-mono text-xs text-zinc-400 hover:text-zinc-950"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* LISTAGEM DE CONTAS A RECEBER */}
      {filteredItems.length === 0 ? (
        <div className="border-2 border-dashed border-zinc-300 bg-zinc-50 p-12 text-center">
          <p className="font-mono text-sm font-bold text-zinc-700">
            Nenhum saldo pendente encontrado para os filtros atuais.
          </p>
          <p className="mt-1 font-mono text-xs text-zinc-500">
            Tudo em dia! Nenhuma OS possui pagamentos em atraso ou saldo a receber neste critério.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isFiado = item.status === 'delivered';
            const isReady = item.status === 'ready';

            return (
              <div
                key={item.id}
                className={`border-2 transition bg-white p-4 ${
                  isFiado
                    ? 'border-red-600 bg-red-50/15'
                    : isReady
                      ? 'border-blue-600 bg-blue-50/15'
                      : 'border-zinc-950'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* DADOS DA OS E CLIENTE */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/os/${item.id}`}
                        className="font-mono text-sm font-black text-zinc-950 underline hover:text-emerald-700"
                      >
                        OS #{item.short_id || item.os_number}
                      </Link>

                      {isFiado ? (
                        <span className="border border-red-600 bg-red-600 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white">
                          🚨 Fiado Entregue ({item.days_waiting} dias)
                        </span>
                      ) : isReady ? (
                        <span className="border border-blue-600 bg-blue-600 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white">
                          📦 Pronto p/ Retirada ({item.days_waiting} dias)
                        </span>
                      ) : (
                        <span className="border border-zinc-950 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-black uppercase text-white">
                          🔧 Em Bancada
                        </span>
                      )}

                      {item.total_paid > 0 && (
                        <span className="border border-emerald-600 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800">
                          Parcialmente Pago ({fmtBRL(item.total_paid)})
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono">
                      <span className="font-bold text-zinc-950">
                        👤 {item.customer_name}
                      </span>
                      {item.customer_phone ? (
                        <span className="text-zinc-600">
                          📞 {item.customer_phone}
                        </span>
                      ) : (
                        <span className="text-zinc-400">Sem telefone</span>
                      )}
                      <span className="text-zinc-500">
                        💻 {item.equipment_brand} {item.equipment_model} ({item.equipment_type})
                      </span>
                    </div>

                    {item.reported_defect && (
                      <p className="font-mono text-[11px] text-zinc-500 line-clamp-1">
                        Defeito: {item.reported_defect}
                      </p>
                    )}
                  </div>

                  {/* VALORES E SALDO */}
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 md:border-l border-zinc-200 pt-3 md:pt-0 md:pl-4 min-w-[160px]">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Saldo em Aberto
                    </span>
                    <strong
                      className={`font-mono text-2xl font-black ${
                        isFiado ? 'text-red-700' : 'text-zinc-950'
                      }`}
                    >
                      {fmtBRL(item.remaining)}
                    </strong>
                    <span className="font-mono text-[11px] text-zinc-500">
                      Total OS: {fmtBRL(item.grand_total)}
                    </span>
                  </div>

                  {/* BOTÕES DE AÇÃO */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 border-t md:border-t-0 border-zinc-200 pt-3 md:pt-0">
                    <button
                      onClick={() => openWaModal(item)}
                      disabled={!item.customer_phone}
                      className="flex-1 sm:flex-initial border-2 border-emerald-700 bg-emerald-700 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-emerald-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 cursor-pointer"
                      title={item.customer_phone ? 'Cobrar pelo WhatsApp' : 'Cliente sem telefone'}
                    >
                      <span>📲</span>
                      <span>Cobrar</span>
                    </button>

                    <button
                      onClick={() => openPayModal(item)}
                      className="flex-1 sm:flex-initial border-2 border-zinc-950 bg-zinc-950 px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>💰</span>
                      <span>Quitar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE QUITAÇÃO RÁPIDA */}
      {payModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md border-2 border-zinc-950 bg-white p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-mono text-base font-black uppercase text-zinc-950">
                  Registrar Pagamento / Baixa
                </h3>
                <p className="font-mono text-xs text-zinc-600">
                  OS #{payModalItem.short_id || payModalItem.os_number} · {payModalItem.customer_name}
                </p>
              </div>
              <button
                onClick={() => setPayModalItem(null)}
                className="font-mono text-sm font-bold text-zinc-400 hover:text-zinc-950"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="space-y-3">
              {/* Resumo de valores */}
              <div className="border border-zinc-200 bg-zinc-50 p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Total da OS:</span>
                  <span className="font-bold">{fmtBRL(payModalItem.grand_total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Já Quitado:</span>
                  <span className="font-bold text-emerald-800">{fmtBRL(payModalItem.total_paid)}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-1 text-sm">
                  <span className="font-bold text-zinc-950">Saldo Devedor:</span>
                  <span className="font-black text-red-700">{fmtBRL(payModalItem.remaining)}</span>
                </div>
              </div>

              {/* Valor a pagar */}
              <div>
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                  Valor a Pagar / Receber (R$) *
                </label>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    value={payAmountStr}
                    onChange={(e) => setPayAmountStr(e.target.value)}
                    className="flex-1 border border-zinc-400 bg-white px-3 py-2 font-mono text-base font-black text-zinc-950 focus:border-zinc-950 focus:outline-none"
                    placeholder="0,00"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPayAmountStr(payModalItem.remaining.toFixed(2).replace('.', ','))}
                    className="border border-zinc-300 bg-zinc-100 px-3 py-1 font-mono text-[11px] font-bold uppercase hover:bg-zinc-200"
                  >
                    Quitar Tudo
                  </button>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div>
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                  Forma de Pagamento *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethodValue)}
                  className="mt-1 w-full border border-zinc-400 bg-white px-3 py-2 font-mono text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Checkbox Caixa (se dinheiro) */}
              {payMethod === 'cash' && activeCashSession && (
                <label className="flex items-center gap-2 border border-emerald-600 bg-emerald-50/60 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addToCash}
                    onChange={(e) => setAddToCash(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-400 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-mono text-xs font-bold text-emerald-950">
                    Lançar entrada no Caixa de Hoje ({activeCashSession.operator_name || 'Sessão aberta'})
                  </span>
                </label>
              )}

              {/* Observação */}
              <div>
                <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                  Observação / Referência (Opcional)
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Ex: Pago via PIX pelo filho, transferência recebida..."
                  className="mt-1 w-full border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-950 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              {payError && (
                <p className="border border-red-300 bg-red-50 p-2 font-mono text-xs text-red-700">
                  {payError}
                </p>
              )}

              <div className="flex gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setPayModalItem(null)}
                  disabled={isSubmittingPay}
                  className="flex-1 border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase text-zinc-950 hover:bg-zinc-100 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPay}
                  className="flex-1 border-2 border-emerald-800 bg-emerald-800 px-3 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-emerald-900 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPay ? 'Gravando…' : 'Confirmar Baixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE WHATSAPP COBRANÇA */}
      {waModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg border-2 border-zinc-950 bg-white p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
              <div>
                <h3 className="font-mono text-base font-black uppercase text-zinc-950 flex items-center gap-1.5">
                  <span>📲</span> Cobrança WhatsApp (1 Clique)
                </h3>
                <p className="font-mono text-xs text-zinc-600">
                  Para: <strong>{waModalItem.customer_name}</strong> · Tel: {waModalItem.customer_phone || 'Sem telefone'}
                </p>
              </div>
              <button
                onClick={() => setWaModalItem(null)}
                className="font-mono text-sm font-bold text-zinc-400 hover:text-zinc-950"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-700">
                    Mensagem a ser enviada:
                  </span>
                  <button
                    type="button"
                    onClick={copyPixKey}
                    className="font-mono text-[10px] font-bold text-emerald-800 hover:underline"
                  >
                    {copiedPix ? '✓ Chave PIX copiada!' : '🔑 Copiar Chave PIX'}
                  </button>
                </div>
                <textarea
                  value={waCustomText}
                  onChange={(e) => setWaCustomText(e.target.value)}
                  rows={8}
                  className="w-full border border-zinc-400 bg-zinc-50 p-3 font-mono text-xs text-zinc-950 focus:border-zinc-950 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="border border-emerald-600 bg-emerald-50/50 p-2.5 text-[11px] font-mono text-emerald-950">
                💡 Ao clicar em <strong>Enviar WhatsApp</strong>, a conversa com o cliente será aberta diretamente com o texto pré-carregado no WhatsApp Web ou App.
              </div>

              <div className="flex gap-2 pt-2 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setWaModalItem(null)}
                  className="flex-1 border-2 border-zinc-950 bg-white px-3 py-2 font-mono text-xs font-bold uppercase text-zinc-950 hover:bg-zinc-100 cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="flex-1 border-2 border-emerald-700 bg-emerald-700 px-3 py-2 font-mono text-xs font-bold uppercase text-white hover:bg-emerald-800 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📲</span>
                  <span>Enviar WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
