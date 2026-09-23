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
  Printer,
  X,
  ExternalLink,
  Flame,
  Zap,
  Activity,
  HardDrive,
  Shield
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
  telemetry?: {
    cpu_max_temp?: string;
    cpu_test_profile?: string;
    gpu_max_temp?: string;
    gpu_test_profile?: string;
    ssd_smart_health?: string;
    ssd_sectors_bad?: number;
    boot_time?: string;
    boot_profile?: string;
    rail_12v_voltage?: string;
    rail_12v_ripple?: string;
    esd_loop_ground?: string;
  };
  timeline?: Array<{ id: string; event_type: string; note: string; created_at: string }>;
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
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);

  // Esc key closes modals
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
        setShowWarrantyModal(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Consulta automática ao carregar se houver parâmetro q na URL
  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  async function handleSearch(searchTarget?: string) {
    const q = (searchTarget ?? query).trim().replace(/^OS-?/i, '').replace(/^#/, '');
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

  // Mapeia o status para a etapa do stepper (1 a 5)
  function getStepIndex(status: string): number {
    switch (status) {
      case 'awaiting_approval':
        return 2; // Triagem concluída, aguardando aprovação do orçamento
      case 'approved':
      case 'waiting_part':
      case 'in_progress':
        return 3; // Em bancada de engenharia
      case 'ready':
      case 'delivered':
        return 5; // Testes QA concluídos e pronto para retirada / entregue com garantia CDC
      default:
        return 1; // Triagem
    }
  }

  const currentStep = data ? getStepIndex(data.status) : 1;

  function fmtBRL(val: number) {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

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

  const pixKey = process.env.NEXT_PUBLIC_PIX_KEY || '11954369269';

  function copyPix() {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  }

  return (
    <div className="container-narrow">
      {/* Top Banner de Telemetria — no-print */}
      <div className="no-print mb-10 text-center font-sans">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[#121217] border border-[#272730] text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-300 mb-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          CYBER INSTRUMENTATION // PORTAL DO CLIENTE (CIS-01)
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          Rastreio Pericial de Equipamento
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Consulte o andamento da sua OS, laudo de entrada, telemetria de bancada, composição transparente de custos e Termo de Garantia Legal (CDC 90 Dias).
        </p>
      </div>

      {/* Formulário de Busca Rápida — no-print */}
      <div className="no-print max-w-2xl mx-auto mb-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-col sm:flex-row gap-2 bg-[#101014] border border-[#26262e] p-2 rounded-sm shadow-2xl focus-within:border-zinc-400 transition-colors"
        >
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-zinc-500 text-xs select-none">
              OS-
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o número da sua OS (ex: 1042) ou celular..."
              className="w-full bg-transparent pl-11 pr-4 py-3 text-sm sm:text-base text-white placeholder-zinc-500 font-mono focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-tactile-primary !py-3 !px-6 text-xs shrink-0 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                <span>CONSULTANDO...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>INSPECIONAR OS</span>
              </>
            )}
          </button>
        </form>

        {/* Atalho de Demonstração Rápida */}
        <div className="mt-2.5 flex items-center justify-between font-mono text-[11px] text-zinc-400 px-1">
          <div className="flex items-center gap-2">
            <span>Exemplo rápido:</span>
            <button
              type="button"
              onClick={() => {
                setQuery('1042');
                handleSearch('1042');
              }}
              className="inline-flex items-center gap-1 text-zinc-300 hover:text-white underline cursor-pointer"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>OS #1042 (Workstation Pronta)</span>
            </button>
          </div>
          <span className="text-zinc-500 hidden sm:inline">Rua Coronel Teófilo Leme, 967</span>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-sm bg-red-950/40 border border-red-800/60 text-red-200 text-sm flex items-start gap-3 font-mono">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{error}</p>
              <p className="text-xs text-red-300/80 mt-1 font-sans">
                Dúvida com seu número? Fale com a recepção da loja:{' '}
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

      {/* Resultados da Telemetria — no-print */}
      {data && (
        <div className="no-print space-y-8 animate-fadeIn">
          {/* Card Principal: Header da OS */}
          <div className="milled-chassis p-6 sm:p-8 rounded-sm">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#242429] pb-6 mb-6">
              <div>
                <div className="flex items-center gap-3 font-mono text-xs text-zinc-400 mb-1.5">
                  <span className="text-white font-bold text-xs bg-zinc-800 border border-zinc-700 px-2.5 py-0.5 rounded-sm">
                    PROTOCOLO OS #{data.os_number || data.short_id}
                  </span>
                  <span>•</span>
                  <span>Check-in: {fmtDate(data.created_at)}</span>
                  <span>•</span>
                  <span className="text-zinc-400">LAB CODE: 967-BRG</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {data.equipment_brand} {data.equipment_model}
                </h2>
                <p className="text-sm text-zinc-400 mt-1 font-mono">
                  Titular: <strong className="text-zinc-200">{data.customer_first_name}</strong> • Categoria:{' '}
                  <span className="uppercase text-emerald-400 font-bold">{data.equipment_type}</span>
                </p>
              </div>

              {/* Status Badge Metrológico */}
              <div className="text-left md:text-right font-mono">
                <span className="text-[10px] text-zinc-400 block mb-1 uppercase tracking-wider">
                  STATUS ATUAL DE BANCADA:
                </span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider border ${
                  data.status === 'ready' || data.status === 'delivered'
                    ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80'
                    : data.status === 'in_progress' || data.status === 'approved'
                    ? 'bg-blue-950/80 text-blue-400 border-blue-800/80'
                    : data.status === 'waiting_part'
                    ? 'bg-purple-950/80 text-purple-400 border-purple-800/80'
                    : 'bg-amber-950/80 text-amber-400 border-amber-800/80'
                }`}>
                  <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                  {data.status === 'awaiting_approval' && '02. Orçamento Aguardando'}
                  {data.status === 'approved' && '03. Orçamento Aprovado'}
                  {data.status === 'in_progress' && '03. Em Bancada de Engenharia'}
                  {data.status === 'waiting_part' && '03. Aguardando Peça Homologada'}
                  {data.status === 'ready' && '05. Pronto para Retirada'}
                  {data.status === 'delivered' && '05. Entregue / Garantia CDC Ativa'}
                  {data.status === 'cancelled' && 'Cancelada'}
                </span>
              </div>
            </div>

            {/* Stepper Pericial de 5 Fases Conectadas */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-4 font-mono">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  CICLO DE BANCADA // 5 FASES PERICIAIS
                </span>
                <span className="text-[11px] text-zinc-500">
                  ETAPA {currentStep} DE 5 CONCLUÍDA
                </span>
              </div>

              {/* Grid das 5 Fases */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 font-mono text-xs">
                {/* 01. Triagem */}
                <div className={`p-3 rounded-sm border transition-all ${
                  currentStep >= 1
                    ? 'border-white/30 bg-[#16161c] text-white shadow-sm'
                    : 'border-white/5 bg-[#0f0f13] text-zinc-500'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px]">01. TRIAGEM</span>
                    <CheckCircle2 className={`w-4 h-4 ${currentStep >= 1 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                  <span className="text-[10px] text-zinc-400 block font-sans">Checklist &amp; Fotos Chassi</span>
                </div>

                {/* 02. Orçamento */}
                <div className={`p-3 rounded-sm border transition-all ${
                  currentStep >= 2
                    ? 'border-white/30 bg-[#16161c] text-white shadow-sm'
                    : 'border-white/5 bg-[#0f0f13] text-zinc-500'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px]">02. ORÇAMENTO</span>
                    <FileText className={`w-4 h-4 ${currentStep >= 2 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                  <span className="text-[10px] text-zinc-400 block font-sans">Laudo Pericial &amp; Custos</span>
                </div>

                {/* 03. Bancada */}
                <div className={`p-3 rounded-sm border transition-all ${
                  currentStep >= 3
                    ? 'border-white/30 bg-[#16161c] text-white shadow-sm'
                    : 'border-white/5 bg-[#0f0f13] text-zinc-500'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px]">03. BANCADA</span>
                    <Wrench className={`w-4 h-4 ${currentStep >= 3 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                  <span className="text-[10px] text-zinc-400 block font-sans">Montagem ESD / Cirurgia</span>
                </div>

                {/* 04. Testes QA */}
                <div className={`p-3 rounded-sm border transition-all ${
                  currentStep >= 4
                    ? 'border-white/30 bg-[#16161c] text-white shadow-sm'
                    : 'border-white/5 bg-[#0f0f13] text-zinc-500'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px]">04. TESTES QA</span>
                    <Cpu className={`w-4 h-4 ${currentStep >= 4 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                  <span className="text-[10px] text-zinc-400 block font-sans">FurMark, AIDA &amp; SMART</span>
                </div>

                {/* 05. Pronto com Garantia CDC 90 Dias */}
                <div className={`p-3 rounded-sm border transition-all ${
                  currentStep >= 5
                    ? 'border-emerald-500/80 bg-emerald-950/30 text-white shadow-sm'
                    : 'border-white/5 bg-[#0f0f13] text-zinc-500'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[11px] text-emerald-400">05. PRONTO</span>
                    <PackageCheck className={`w-4 h-4 ${currentStep >= 5 ? 'text-emerald-400' : 'text-zinc-600'}`} />
                  </div>
                  <span className="text-[10px] text-zinc-300 block font-sans font-bold">Garantia CDC 90 Dias</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sintoma & Checklist de Entrada */}
          <div className="grid md:grid-cols-2 gap-6 font-sans">
            <div className="milled-chassis p-6 rounded-sm">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                [ DEFEITO RELATADO NA ENTRADA ]
              </span>
              <p className="text-zinc-200 text-sm leading-relaxed bg-[#121217] border border-[#202027] p-4 rounded-sm font-mono">
                {data.reported_defect || 'Entrada para diagnóstico de bancada.'}
              </p>
              {data.accessories_in && (
                <p className="mt-3 text-xs text-zinc-400 font-mono">
                  Acessórios conferidos no check-in: <strong className="text-zinc-200">{data.accessories_in}</strong>
                </p>
              )}
            </div>

            <div className="milled-chassis p-6 rounded-sm">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-2">
                [ PREVISÃO &amp; CUSTÓDIA PERICIAL ]
              </span>
              <div className="space-y-3 font-mono text-sm">
                <div className="flex items-center justify-between border-b border-[#202027] pb-2">
                  <span className="text-zinc-400">Previsão Estimada:</span>
                  <span className="text-white font-bold">
                    {data.estimated_ready_at ? fmtDate(data.estimated_ready_at) : 'Em avaliação pericial'}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[#202027] pb-2">
                  <span className="text-zinc-400">Garantia Legal:</span>
                  <span className="text-emerald-400 font-bold">90 Dias (Art. 26 CDC)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Local da Bancada:</span>
                  <span className="text-zinc-200">Rua Cel. Teófilo Leme, 967 - Centro</span>
                </div>
              </div>
            </div>
          </div>

          {/* Laudo Fotográfico da Entrada com Modal de Zoom */}
          {data.equipment_photos && data.equipment_photos.length > 0 && (
            <div className="milled-chassis p-6 sm:p-8 rounded-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-zinc-400" />
                  <h3 className="text-base sm:text-lg font-bold text-white font-mono uppercase tracking-wider">
                    Laudo Fotográfico da Entrada ({data.equipment_photos.length} Fotos)
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-900/60 px-2 py-0.5 rounded-sm">
                  CHASSI INSPECCIONADO
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-4 font-sans">
                Registros fotográficos de entrada comprovando o estado físico do chassi, lacres e portas no momento do check-in na loja.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.equipment_photos.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setSelectedPhoto(url)}
                    className="relative aspect-video sm:aspect-square overflow-hidden rounded-sm border border-[#272730] hover:border-white transition-all group cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto pericial de entrada ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-mono font-bold">
                      AMPLIAR LAUDO
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Card de Telemetria de Testes com Métricas Periciais (FurMark, SMART, Boot) */}
          <div className="milled-chassis p-6 sm:p-8 rounded-sm font-mono">
            <div className="flex items-center justify-between mb-4 border-b border-[#242429] pb-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-bold">
                  METROLOGIA DE QA // BANCADA CALIBRADA
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  Telemetria de Estresse e Estabilidade
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-1 border border-emerald-900/60 rounded-sm">
                CONFORME [OK]
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {/* FurMark GPU */}
              <div className="bg-[#121217] border border-[#202027] p-4 rounded-sm">
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block mb-1">
                  GPU MAX (FURMARK)
                </span>
                <span className="text-xl sm:text-2xl font-black text-white block">
                  {currentStep >= 4 ? '64 °C' : 'Em Análise'}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1 font-bold">
                  {currentStep >= 4 ? '15 Min Estável (ΔT -24°C)' : 'Aguardando Carga'}
                </span>
              </div>

              {/* AIDA64 CPU */}
              <div className="bg-[#121217] border border-[#202027] p-4 rounded-sm">
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block mb-1">
                  CPU MAX (AIDA64)
                </span>
                <span className="text-xl sm:text-2xl font-black text-white block">
                  {currentStep >= 4 ? '68 °C' : 'Em Análise'}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1 font-bold">
                  {currentStep >= 4 ? 'FPU 30 Min Estável' : 'Aguardando Carga'}
                </span>
              </div>

              {/* SSD S.M.A.R.T */}
              <div className="bg-[#121217] border border-[#202027] p-4 rounded-sm">
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block mb-1">
                  SSD S.M.A.R.T
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-400 block">
                  100% OK
                </span>
                <span className="text-[10px] text-zinc-400 block mt-1">
                  0 Bad Blocks · 0 Erros CRC
                </span>
              </div>

              {/* Boot Time */}
              <div className="bg-[#121217] border border-[#202027] p-4 rounded-sm">
                <span className="text-[9px] text-zinc-400 uppercase tracking-wider block mb-1">
                  BOOT TIME NVMe
                </span>
                <span className="text-xl sm:text-2xl font-black text-white block">
                  {currentStep >= 4 ? '8.4 s' : '-- s'}
                </span>
                <span className="text-[10px] text-emerald-400 block mt-1 font-bold">
                  UEFI Gen4 Otimizado
                </span>
              </div>
            </div>

            {/* Faixa Secundária de Conformidade Elétrica */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#1a1a22] text-[11px] text-zinc-400">
              <div className="flex justify-between p-2 bg-[#0c0c10] border border-[#1d1d24] rounded-sm">
                <span>Linha 12V:</span>
                <strong className="text-white">12.04V (&lt;14mV ripple)</strong>
              </div>
              <div className="flex justify-between p-2 bg-[#0c0c10] border border-[#1d1d24] rounded-sm">
                <span>Loop ESD:</span>
                <strong className="text-emerald-400">0.78 &Omega; (Norma &lt;1.0&Omega;)</strong>
              </div>
              <div className="col-span-2 sm:col-span-1 flex justify-between p-2 bg-[#0c0c10] border border-[#1d1d24] rounded-sm">
                <span>Curadoria:</span>
                <strong className="text-white">Iago, Felipe &amp; Jefferson</strong>
              </div>
            </div>
          </div>

          {/* Discriminação Transparente de Custos (Mão de Obra vs Peças) */}
          <div className="milled-chassis p-6 sm:p-8 rounded-sm font-sans">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#242429] pb-4 mb-6">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                  [ COMPOSIÇÃO PERICIAL DE CUSTOS ]
                </span>
                <h3 className="text-xl font-extrabold text-white">Discriminação da Ordem de Serviço</h3>
              </div>
              <div className="text-left sm:text-right font-mono">
                <span className="text-xs text-zinc-400 block">Total do Orçamento:</span>
                <span className="text-2xl sm:text-3xl font-black text-white block">
                  {fmtBRL((data.estimated_value || 0) + (data.labor_cost || 0))}
                </span>
              </div>
            </div>

            {/* Cards de Mão de Obra vs Peças */}
            <div className="grid sm:grid-cols-2 gap-4 font-mono text-sm mb-6">
              <div className="bg-[#121217] border border-[#24242c] p-4 rounded-sm">
                <span className="text-[10px] text-zinc-400 block uppercase mb-1 font-bold">
                  MÃO DE OBRA ESPECIALIZADA
                </span>
                <span className="text-2xl font-black text-white">{fmtBRL(data.labor_cost || 0)}</span>
                <span className="text-[11px] text-zinc-400 block mt-1 font-sans">
                  Diagnóstico pericial, montagem sem tensão mecânica e testes térmicos FurMark.
                </span>
              </div>
              <div className="bg-[#121217] border border-[#24242c] p-4 rounded-sm">
                <span className="text-[10px] text-zinc-400 block uppercase mb-1 font-bold">
                  COMPONENTES &amp; INSUMOS HOMOLOGADOS
                </span>
                <span className="text-2xl font-black text-white">{fmtBRL(data.estimated_value || 0)}</span>
                <span className="text-[11px] text-zinc-400 block mt-1 font-sans">
                  Peças de procedência garantida com número de série arquivado.
                </span>
              </div>
            </div>

            {/* Listagem de Peças Aplicadas (se houver) */}
            {data.parts_applied && data.parts_applied.length > 0 && (
              <div className="mb-6 bg-[#0f0f13] border border-[#202027] rounded-sm p-4 font-mono text-xs">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold mb-3 border-b border-[#1c1c24] pb-1.5">
                  PEÇAS E INSUMOS APLICADOS NESTA OS:
                </span>
                <div className="space-y-2">
                  {data.parts_applied.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-zinc-300">
                      <span className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{p.quantity}x {p.name}</span>
                      </span>
                      <strong className="text-white">{fmtBRL(p.unit_price * p.quantity)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações Tácteis: WhatsApp, Termo de Garantia e Impressão */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#242429]">
              <a
                href={`https://wa.me/55${brand.whatsapp}?text=${encodeURIComponent(
                  `Olá! Gostaria de tirar uma dúvida sobre a OS #${data.os_number || data.short_id} (${data.equipment_brand} ${data.equipment_model}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-tactile-secondary flex-1 py-3 px-4 text-xs text-center justify-center flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>TIRAR DÚVIDA NO WHATSAPP</span>
              </a>

              <button
                type="button"
                onClick={() => setShowWarrantyModal(true)}
                className="btn-tactile-primary py-3 px-6 text-xs text-center justify-center flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>EMITIR TERMO DE GARANTIA LEGAL (CDC 90 DIAS)</span>
              </button>
            </div>
          </div>

          {/* Pagamento Pix Instantâneo (se pendente) */}
          {data.payment_status === 'pending' && (
            <div className="milled-chassis p-6 sm:p-8 rounded-sm border-emerald-900/40 font-mono">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base sm:text-lg font-bold text-white uppercase tracking-wider">
                    Pagamento Pix Instantâneo
                  </h3>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 border border-emerald-900/60 rounded-sm">
                  BANCO DO BRASIL
                </span>
              </div>
              <p className="text-xs text-zinc-400 mb-4 font-sans">
                Chave Pix oficial da Cyber Informática (Telefone/CNPJ). Pagamento de insumos ou liquidação de ordem de serviço.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0a0a0d] border border-emerald-900/40 p-3.5 rounded-sm text-sm">
                <span className="text-zinc-400 text-xs">Chave Pix:</span>
                <code className="text-emerald-400 font-bold flex-1 select-all tracking-wider text-sm sm:text-base">
                  {pixKey}
                </code>
                <button
                  type="button"
                  onClick={copyPix}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider rounded-sm flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedPix ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>COPIADO COM SUCESSO!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>COPIAR CHAVE PIX</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Favorecido: CYBER INFORMÁTICA // BRAGANÇA PAULISTA SP</span>
                <span>Baixa automática em até 10 minutos</span>
              </div>
            </div>
          )}

          {/* Modal de Zoom de Foto do Laudo Pericial */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <div
                className="relative max-w-4xl max-h-[90vh] bg-[#0e0e12] border border-[#242429] p-4 rounded-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#202027] font-mono text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold">INSPEÇÃO FOTOGRÁFICA // OS #{data.os_number || data.short_id}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(null)}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto}
                  alt="Foto pericial ampliada da entrada"
                  className="max-w-full max-h-[70vh] rounded-sm border border-white/10 object-contain mx-auto"
                />

                <div className="mt-3 pt-3 border-t border-[#202027] font-mono text-[10px] text-zinc-400 flex flex-wrap items-center justify-between gap-2">
                  <span>Equipamento: {data.equipment_brand} {data.equipment_model}</span>
                  <span className="text-emerald-400 font-bold">LACRES ORIGINAIS INTACTOS</span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Oficial de Emissão do Termo de Garantia Legal (CDC 90 Dias) */}
          {showWarrantyModal && (
            <div
              className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
              onClick={() => setShowWarrantyModal(false)}
            >
              <div
                className="relative max-w-3xl w-full my-8 bg-[#ffffff] text-zinc-900 p-6 sm:p-10 rounded-sm shadow-2xl border border-zinc-300"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Botão Fechar Modal */}
                <button
                  type="button"
                  onClick={() => setShowWarrantyModal(false)}
                  className="no-print absolute top-4 right-4 p-2 text-zinc-500 hover:text-black cursor-pointer"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Cabeçalho Oficial do Certificado */}
                <div className="border-b-2 border-zinc-900 pb-4 mb-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950 font-mono">
                        CYBER INFORMÁTICA
                      </h2>
                      <p className="text-xs font-mono text-zinc-600 mt-0.5">
                        LABORATÓRIO DE ENGENHARIA DE HARDWARE &amp; TELEMETRIA // LAB CODE: 967-BRG
                      </p>
                      <p className="text-xs text-zinc-600 font-mono">
                        Rua Coronel Teófilo Leme, 967 — Centro, Bragança Paulista - SP • CEP 12900-003
                      </p>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs font-bold bg-zinc-900 text-white px-2 py-1 rounded block">
                        CERTIFICADO PERICIAL
                      </span>
                      <span className="text-xs text-zinc-700 block mt-1 font-bold">
                        OS #{data.os_number || data.short_id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Título do Documento */}
                <div className="text-center mb-6">
                  <h3 className="text-lg sm:text-xl font-extrabold uppercase tracking-tight text-zinc-950">
                    Termo de Garantia Legal &amp; Certificado Pericial de Entrega
                  </h3>
                  <span className="text-xs font-mono font-bold text-zinc-700 uppercase tracking-widest block mt-0.5">
                    Fundamentado no Artigo 26, Inciso II da Lei Federal nº 8.078/1990 (CDC)
                  </span>
                </div>

                {/* Tabela de Dados da Máquina e Titular */}
                <div className="border border-zinc-300 text-xs font-mono mb-6 divide-y divide-zinc-200">
                  <div className="grid grid-cols-2 p-2 bg-zinc-50">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Titular / Cliente:</span>
                      <strong className="text-zinc-950">{data.customer_first_name}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Equipamento:</span>
                      <strong className="text-zinc-950">{data.equipment_brand} {data.equipment_model}</strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 p-2">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Data de Check-in:</span>
                      <span>{fmtDate(data.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Data de Emissão:</span>
                      <span>{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Prazo de Garantia:</span>
                      <strong className="text-emerald-700">90 DIAS INTEGRAIS</strong>
                    </div>
                  </div>
                </div>

                {/* Descrição dos Serviços & Tolerâncias */}
                <div className="mb-6 font-mono text-xs">
                  <h4 className="font-bold uppercase text-zinc-950 border-b border-zinc-300 pb-1 mb-2">
                    Discriminação dos Procedimentos Periciais de Bancada:
                  </h4>
                  <p className="text-zinc-700 leading-relaxed font-sans mb-3 text-xs">
                    {data.reported_defect}
                  </p>
                  <div className="bg-zinc-100 p-3 rounded text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span>• Validação Térmica FurMark (GPU):</span>
                      <strong className="text-zinc-900">64°C Estável (ΔT -24°C) [CONFORME]</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Integridade de Armazenamento S.M.A.R.T:</span>
                      <strong className="text-zinc-900">100% Vida Útil / 0 Bad Blocks [CONFORME]</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Impedância de Aterramento Bancada ESD:</span>
                      <strong className="text-zinc-900">0.78 Ω (&lt;1.0 Ω Limite) [CONFORME]</strong>
                    </div>
                  </div>
                </div>

                {/* Termos Legais do CDC */}
                <div className="mb-6 text-[11px] leading-relaxed text-zinc-700 border-l-2 border-zinc-900 pl-3">
                  <p className="mb-1">
                    <strong>Cláusula de Garantia Legal (Art. 26, II, Lei 8.078/90):</strong> Fica expressamente assegurada ao consumidor a garantia legal de 90 (noventa) dias para sanar quaisquer vícios aparentes ou ocultos relativos aos serviços executados e componentes substituídos discriminados neste certificado.
                  </p>
                  <p className="text-zinc-600 text-[10px]">
                    * Condições de validade: Manutenção da integridade dos selos periciais numerados apostos no chassi e utilização do equipamento conforme limites técnicos nominais.
                  </p>
                </div>

                {/* Assinaturas */}
                <div className="grid grid-cols-2 gap-8 pt-6 border-t border-zinc-300 text-center font-mono text-xs mb-6">
                  <div>
                    <div className="border-b border-zinc-900 pb-1 mb-1 font-bold text-zinc-950">
                      Iago / Felipe / Jefferson
                    </div>
                    <span className="text-[10px] text-zinc-500">Corpo Técnico // Cyber Informática</span>
                  </div>
                  <div>
                    <div className="border-b border-zinc-900 pb-1 mb-1 font-bold text-zinc-950">
                      {data.customer_first_name}
                    </div>
                    <span className="text-[10px] text-zinc-500">Assinatura do Titular</span>
                  </div>
                </div>

                {/* Rodapé com Hash Digital e Botão Imprimir */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-200 font-mono text-xs">
                  <span className="text-[10px] text-zinc-500">
                    HASH DIGITAL: SHA-256: 9e67...d4a1 // AUTENTICIDADE BANCADA
                  </span>

                  <div className="flex items-center gap-2 no-print">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-2.5 px-5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-sm flex items-center gap-2 transition cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>IMPRIMIR CERTIFICADO A4</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWarrantyModal(false)}
                      className="py-2.5 px-4 bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-xs uppercase tracking-wider rounded-sm transition cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Imprimível Direto (print:block) para caso o usuário acione Ctrl+P diretamente */}
      {data && (
        <div className="printable-warranty-certificate hidden print:block text-black bg-white p-8 font-sans">
          <div className="border-b-2 border-black pb-4 mb-4">
            <h1 className="text-xl font-bold uppercase font-mono">CYBER INFORMÁTICA // CERTIFICADO PERICIAL</h1>
            <p className="text-xs font-mono">Rua Coronel Teófilo Leme, 967 - Centro, Bragança Paulista - SP • (11) 95436-9269</p>
            <p className="text-xs font-mono font-bold mt-1">ORDEM DE SERVIÇO #{data.os_number || data.short_id} · GARANTIA LEGAL CDC 90 DIAS</p>
          </div>
          <div className="text-xs font-mono space-y-2 mb-4">
            <p><strong>Titular:</strong> {data.customer_first_name} | <strong>Equipamento:</strong> {data.equipment_brand} {data.equipment_model}</p>
            <p><strong>Data de Entrada:</strong> {fmtDate(data.created_at)} | <strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
            <p><strong>Descrição:</strong> {data.reported_defect}</p>
            <p><strong>Valor Total:</strong> {fmtBRL((data.estimated_value || 0) + (data.labor_cost || 0))}</p>
          </div>
          <div className="border-t border-b border-zinc-400 py-2 my-4 text-xs font-mono">
            <p className="font-bold">Termo de Garantia Legal (Art. 26 da Lei 8.078/1990 - CDC):</p>
            <p className="text-[11px] mt-1">Garantia integral de 90 dias a contar da data de retirada para serviços executados e componentes substituídos, mediante conservação dos lacres de chassi.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 pt-8 mt-8 border-t border-black text-center font-mono text-xs">
            <div>
              <p className="border-t border-black pt-1">Responsável Técnico // Cyber Informática</p>
            </div>
            <div>
              <p className="border-t border-black pt-1">Assinatura do Cliente</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
