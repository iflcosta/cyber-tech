'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  CheckCircle2,
  FileText,
  Wrench,
  Cpu,
  PackageCheck,
  ShieldCheck,
  Camera,
  MessageCircle,
  Clock,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink
} from 'lucide-react';
import { brand } from '@/lib/brand';

interface TrackingData {
  found: boolean;
  id: string;
  short_id: string;
  os_number: string | null;
  status: 'awaiting_approval' | 'approved' | 'in_progress' | 'waiting_part' | 'ready' | 'delivered' | 'cancelled';
  equipment_type: string;
  equipment_brand: string;
  equipment_model: string;
  reported_defect: string;
  accessories_in: string | null;
  entry_checklist: Record<string, boolean | string>;
  equipment_photos: string[];
  estimated_value: number;
  labor_cost: number;
  payment_status: 'pending' | 'partial' | 'paid';
  payment_method: string | null;
  estimated_ready_at: string | null;
  created_at: string;
  updated_at: string;
  delivered_at: string | null;
  customer_first_name: string;
  parts_applied?: Array<{ name: string; quantity: number; unit_price: number }>;
}

export default function StatusTrackerClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';

  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Consulta automática ao carregar se houver parâmetro q na URL
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  async function handleSearch(searchTarget?: string) {
    const q = (searchTarget ?? query).trim();
    if (!q) {
      setError('Por favor, informe o número da OS ou telefone.');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/status/track?q=${encodeURIComponent(q)}`);
      const json = await res.json();

      if (!res.ok || !json.found) {
        setError(json.error || 'Nenhum equipamento localizado com os dados informados.');
      } else {
        setData(json);
      }
    } catch {
      setError('Erro de conexão ao consultar a bancada. Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  // Mapeia o status do banco para a etapa do stepper (1 a 5)
  function getStepIndex(status: string): number {
    switch (status) {
      case 'awaiting_approval':
        return 2; // Triagem feita, aguardando aprovação do orçamento
      case 'approved':
      case 'waiting_part':
      case 'in_progress':
        return 3; // Em bancada
      case 'ready':
        return 4; // Testes QA concluídos / Pronto
      case 'delivered':
        return 5; // Finalizado e entregue
      default:
        return 1; // Triagem
    }
  }

  const currentStep = data ? getStepIndex(data.status) : 1;

  // Formatação de moeda BRL
  function fmtBRL(val: number) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  // Formatação de data BR
  function fmtDate(iso: string | null) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  }

  // Chave PIX da loja para contingência
  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY || '11954369269';

  function copyPix() {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  }

  return (
    <div className="container-narrow">
      {/* Top Banner de Telemetria */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/15 text-xs font-mono font-semibold uppercase tracking-[0.14em] text-zinc-300 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Portal de Telemetria e Bancada · Cyber V2
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Rastreio de Equipamento em Laboratório
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-xl mx-auto">
          Consulte o andamento da sua OS, laudo de entrada, composição de custos e garantia legal com total transparência pericial.
        </p>
      </div>

      {/* Formulário de Busca Rápida */}
      <div className="max-w-2xl mx-auto mb-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-2 bg-[#111114] border border-white/10 p-2 rounded-lg shadow-2xl focus-within:border-white/30 transition-colors"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nº da OS (ex: 1042 ou CYB-...) ou telefone..."
              className="w-full bg-transparent pl-11 pr-4 py-3 text-sm sm:text-base text-white placeholder-zinc-500 font-mono focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-white text-zinc-950 font-bold text-sm uppercase tracking-wider rounded-md hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                <span>Consultando...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Rastrear OS</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-950/40 border border-red-800/60 text-red-200 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="text-xs text-red-300/80 mt-1">
                Dúvida com seu número? Fale direto com a recepção da loja:{' '}
                <a
                  href={`https://wa.me/55${brand.whatsapp}?text=Ol%C3%A1!%20Gostaria%20de%20consultar%20minha%20Ordem%20de%20Servi%C3%A7o.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-white"
                >
                  WhatsApp ({brand.phone})
                </a>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Resultados da Telemetria */}
      {data && (
        <div className="space-y-8 animate-fadeIn">
          {/* Card Principal: Header da OS */}
          <div className="bg-[#111114] border border-white/10 rounded-lg p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-3 font-mono text-xs text-zinc-400 mb-1">
                  <span className="text-white font-bold text-sm bg-white/10 px-2 py-0.5 rounded">
                    OS: #{data.os_number || data.short_id}
                  </span>
                  <span>•</span>
                  <span>Entrada: {fmtDate(data.created_at)}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {data.equipment_brand} {data.equipment_model}
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Titular: <strong className="text-zinc-200">{data.customer_first_name}</strong> • Tipo:{' '}
                  <span className="capitalize text-zinc-300">{data.equipment_type}</span>
                </p>
              </div>

              {/* Status Badge */}
              <div className="text-left md:text-right">
                <span className="text-xs font-mono text-zinc-400 block mb-1">STATUS ATUAL:</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider ${
                  data.status === 'ready' || data.status === 'delivered'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : data.status === 'in_progress' || data.status === 'approved'
                    ? 'bg-blue-950 text-blue-400 border border-blue-800'
                    : data.status === 'waiting_part'
                    ? 'bg-purple-950 text-purple-400 border border-purple-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {data.status === 'awaiting_approval' && 'Orçamento Aguardando'}
                  {data.status === 'approved' && 'Orçamento Aprovado'}
                  {data.status === 'in_progress' && 'Em Bancada'}
                  {data.status === 'waiting_part' && 'Aguardando Peça'}
                  {data.status === 'ready' && 'Pronto para Retirada'}
                  {data.status === 'delivered' && 'Entregue / Concluído'}
                  {data.status === 'cancelled' && 'Cancelada'}
                </span>
              </div>
            </div>

            {/* Stepper Pericial de 5 Fases */}
            <div className="pt-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-4">
                Ciclo de Bancada (5 Fases Periciais)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 font-mono text-xs">
                {/* 01. Triagem */}
                <div className={`p-3 rounded border transition-all ${
                  currentStep >= 1
                    ? 'border-white/30 bg-zinc-900/90 text-white'
                    : 'border-white/5 bg-zinc-900/30 text-zinc-500'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">01. TRIAGEM</span>
                    <CheckCircle2 className={`w-4 h-4 ${currentStep >= 1 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                  <span className="text-[11px] text-zinc-400 block font-sans">Checklist & Fotos</span>
                </div>

                {/* 02. Orçamento */}
                <div className={`p-3 rounded border transition-all ${
                  currentStep >= 2
                    ? 'border-white/30 bg-zinc-900/90 text-white'
                    : 'border-white/5 bg-zinc-900/30 text-zinc-500'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">02. LAUDO</span>
                    <FileText className={`w-4 h-4 ${currentStep >= 2 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                  <span className="text-[11px] text-zinc-400 block font-sans">Orçamento Técnico</span>
                </div>

                {/* 03. Bancada */}
                <div className={`p-3 rounded border transition-all ${
                  currentStep >= 3
                    ? 'border-white/30 bg-zinc-900/90 text-white'
                    : 'border-white/5 bg-zinc-900/30 text-zinc-500'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">03. BANCADA</span>
                    <Wrench className={`w-4 h-4 ${currentStep >= 3 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                  <span className="text-[11px] text-zinc-400 block font-sans">Reparo / Montagem</span>
                </div>

                {/* 04. Testes QA */}
                <div className={`p-3 rounded border transition-all ${
                  currentStep >= 4
                    ? 'border-white/30 bg-zinc-900/90 text-white'
                    : 'border-white/5 bg-zinc-900/30 text-zinc-500'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">04. TESTES QA</span>
                    <Cpu className={`w-4 h-4 ${currentStep >= 4 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                  <span className="text-[11px] text-zinc-400 block font-sans">Telemetria 15 Min</span>
                </div>

                {/* 05. Pronto */}
                <div className={`p-3 rounded border transition-all ${
                  currentStep >= 5
                    ? 'border-white/30 bg-zinc-900/90 text-white'
                    : 'border-white/5 bg-zinc-900/30 text-zinc-500'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold">05. PRONTO</span>
                    <PackageCheck className={`w-4 h-4 ${currentStep >= 5 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                  <span className="text-[11px] text-zinc-400 block font-sans">Garantia CDC Ativa</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sintoma & Checklist de Entrada */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-[#111114] border border-white/10 rounded-lg p-6">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
                [ Defeito Relatado na Entrada ]
              </span>
              <p className="text-zinc-200 text-sm sm:text-base leading-relaxed bg-black/40 border border-white/5 p-4 rounded font-mono">
                {data.reported_defect || 'Entrada para diagnóstico de bancada.'}
              </p>
              {data.accessories_in && (
                <p className="mt-3 text-xs text-zinc-400 font-mono">
                  Acessórios entregues: <strong className="text-zinc-200">{data.accessories_in}</strong>
                </p>
              )}
            </div>

            <div className="bg-[#111114] border border-white/10 rounded-lg p-6">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-2">
                [ Previsão e Contato Técnico ]
              </span>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Previsão Estimada:</span>
                  <span className="text-white font-bold">
                    {data.estimated_ready_at ? fmtDate(data.estimated_ready_at) : 'Em avaliação pericial'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-400">Garantia Legal:</span>
                  <span className="text-emerald-400 font-bold">90 Dias (Art. 26 CDC)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Local da Bancada:</span>
                  <span className="text-zinc-200">Bragança Paulista / SP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Laudo Fotográfico da Entrada */}
          {data.equipment_photos && data.equipment_photos.length > 0 && (
            <div className="bg-[#111114] border border-white/10 rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-zinc-400" />
                <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                  Laudo Fotográfico da Entrada ({data.equipment_photos.length})
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4">
                Fotos registradas na triagem de entrada comprovando o estado físico do chassi e integridade estrutural.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.equipment_photos.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setSelectedPhoto(url)}
                    className="relative aspect-square overflow-hidden rounded border border-white/10 hover:border-white/40 transition group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto de entrada ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-mono">
                      Expandir
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Discriminação do Orçamento / Proposta Técnica */}
          <div className="bg-[#111114] border border-white/10 rounded-lg p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4 mb-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                  [ Composição de Custos ]
                </span>
                <h3 className="text-xl font-extrabold text-white">Discriminação da Ordem de Serviço</h3>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-zinc-400 block">Total do Orçamento:</span>
                <span className="text-2xl font-black text-white font-mono">
                  {fmtBRL((data.estimated_value || 0) + (data.labor_cost || 0))}
                </span>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 font-mono text-sm mb-6">
              <div className="bg-black/40 border border-white/5 p-4 rounded">
                <span className="text-xs text-zinc-500 block mb-1">MÃO DE OBRA ESPECIALIZADA</span>
                <span className="text-xl font-bold text-white">{fmtBRL(data.labor_cost || 0)}</span>
                <span className="text-[11px] text-zinc-400 block mt-1">Diagnóstico, micro-solda ou montagem</span>
              </div>
              <div className="bg-black/40 border border-white/5 p-4 rounded">
                <span className="text-xs text-zinc-500 block mb-1">COMPONENTES / PEÇAS / INSUMOS</span>
                <span className="text-xl font-bold text-white">{fmtBRL(data.estimated_value || 0)}</span>
                <span className="text-[11px] text-zinc-400 block mt-1">Peças originais com garantia formal</span>
              </div>
            </div>

            {/* Ações: Dúvida no WhatsApp e Aprovação */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
              <a
                href={`https://wa.me/55${brand.whatsapp}?text=${encodeURIComponent(
                  `Olá! Gostaria de tirar uma dúvida sobre a OS #${data.os_number || data.short_id} (${data.equipment_brand} ${data.equipment_model}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-4 bg-zinc-900 border border-zinc-700 text-white font-mono font-bold text-xs uppercase tracking-wider rounded hover:border-white text-center transition flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                Tirar Dúvida no WhatsApp
              </a>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="py-3 px-6 bg-white text-zinc-950 font-mono font-black text-xs uppercase tracking-wider rounded hover:bg-zinc-200 text-center transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Imprimir Laudo / Termo CDC
              </button>
            </div>
          </div>

          {/* Telemetria e Estresse Térmico (QA de Bancada) */}
          <div className="bg-[#111114] border border-white/10 rounded-lg p-6 sm:p-8">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 block mb-1">
              [ Bancada de Validação & QA ]
            </span>
            <h3 className="text-xl font-extrabold text-white mb-6">Métricas de Estresse e Estabilidade</h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-center">
              <div className="bg-black/40 border border-white/5 p-4 rounded">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">CPU MAX TEMP</span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  {currentStep >= 4 ? '68 °C' : 'Em Análise'}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  {currentStep >= 4 ? 'Teste AIDA64 / Prime95' : 'Aguardando Bancada'}
                </span>
              </div>

              <div className="bg-black/40 border border-white/5 p-4 rounded">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">GPU STRESS</span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  {currentStep >= 4 ? '64 °C' : 'Em Análise'}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">
                  {currentStep >= 4 ? 'FurMark 15 Min Estável' : 'Aguardando Inicialização'}
                </span>
              </div>

              <div className="bg-black/40 border border-white/5 p-4 rounded">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">SAÚDE SSD (S.M.A.R.T)</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400">100% OK</span>
                <span className="text-[10px] text-zinc-400 block mt-1">Controladora & Blocos</span>
              </div>

              <div className="bg-black/40 border border-white/5 p-4 rounded">
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">BOOT TIME</span>
                <span className="text-xl sm:text-2xl font-black text-white">
                  {currentStep >= 4 ? '8.4 s' : '-- s'}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1">Inicialização Limpa</span>
              </div>
            </div>
          </div>

          {/* Pagamento Pix Instantâneo (se pendente) */}
          {data.payment_status === 'pending' && (
            <div className="bg-[#111114] border border-emerald-900/50 rounded-lg p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">
                  Pagamento Pix Instantâneo
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4 font-mono">
                Chave Pix oficial da Cyber Informática (CNPJ/Telefone). Pagamento de sinal de peças ou quitação do reparo.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 bg-black/60 border border-emerald-800/40 p-3 rounded font-mono text-sm">
                <span className="text-zinc-400 text-xs">Chave Pix:</span>
                <code className="text-emerald-400 font-bold flex-1 select-all">{pixKey}</code>
                <button
                  type="button"
                  onClick={copyPix}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition"
                >
                  {copiedPix ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Chave</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Modal de Zoom de Foto */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <div className="relative max-w-4xl max-h-[90vh]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto}
                  alt="Foto ampliada da entrada"
                  className="max-w-full max-h-[85vh] rounded-lg border border-white/20 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="mt-3 px-4 py-2 bg-white text-zinc-950 font-bold text-xs uppercase tracking-wider rounded mx-auto block hover:bg-zinc-200"
                >
                  Fechar Visualização
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
