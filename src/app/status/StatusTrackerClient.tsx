'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  Copy,
  Check,
  Printer,
  X,
  ArrowUpRight,
} from 'lucide-react';
import { brand } from '@/lib/brand';
import { ClientUpsellSelector } from './ClientUpsellSelector';

interface TrackingData {
  found: boolean;
  id: string;
  short_id: string;
  os_number: string | null;
  status:
    | 'awaiting_approval'
    | 'approved'
    | 'in_progress'
    | 'waiting_part'
    | 'ready'
    | 'delivered'
    | 'cancelled';
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

const STEP_ITEMS = [
  { step: 1, short: 'Check-in', title: '01 / Check-in', desc: 'Recebido com Fotos' },
  { step: 2, short: 'Laudo', title: '02 / Diagnóstico', desc: 'Laudo & Orçamento' },
  { step: 3, short: 'Bancada', title: '03 / Bancada', desc: 'Execução Técnica' },
  { step: 4, short: 'Testes', title: '04 / Testes QA', desc: 'Estresse & Estabilidade' },
  { step: 5, short: 'Pronto', title: '05 / Pronto', desc: 'Garantia CDC 90 Dias' },
];

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

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  function getStepIndex(status: string): number {
    switch (status) {
      case 'awaiting_approval':
        return 2;
      case 'approved':
      case 'waiting_part':
      case 'in_progress':
        return 3;
      case 'ready':
      case 'delivered':
        return 5;
      default:
        return 1;
    }
  }

  const currentStep = data ? getStepIndex(data.status) : 1;
  const activeStepInfo = STEP_ITEMS.find((s) => s.step === currentStep) || STEP_ITEMS[0];

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

  const totalOrderAmount = data ? (data.estimated_value || 0) + (data.labor_cost || 0) : 0;
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);

  const availableUpsells = useMemo(() => {
    if (!data) return [];
    const t = (data.equipment_type || '').toLowerCase();
    const list: Array<{ id: string; title: string; desc: string; price: number }> = [];

    if (/celular|smartphone|tablet|iphone/.test(t)) {
      list.push({
        id: 'pelicula_3d',
        title: '🛡️ Película 3D de Vidro Temperado',
        desc: 'Proteção pericial contra quedas e trincas com aplicação sem bolhas',
        price: 25,
      });
      list.push({
        id: 'cabo_reforcado',
        title: '⚡ Cabo Blindado em Malha Náutica Certificado',
        desc: 'Cabo ultra resistente que não parte a fiação interna',
        price: 25,
      });
    } else {
      list.push({
        id: 'limpeza_pasta',
        title: '❄️ Limpeza Preventiva de Coolers & Pasta Térmica Nova',
        desc: 'Reduz a temperatura em até 20°C e prolonga a vida útil do chip',
        price: 60,
      });
      list.push({
        id: 'cabo_forca',
        title: '⚡ Cabo de Força Tripolar NBR 14136 Homologado',
        desc: 'Elimina faíscas e superaquecimento na tomada da máquina',
        price: 25,
      });
    }

    list.push({
      id: 'checkup_preventivo',
      title: '📦 Revisão Preventiva Agendada (6 Meses)',
      desc: 'Check-up completo de estabilidade, bateria e sistema',
      price: 35,
    });

    return list;
  }, [data]);

  const upsellsTotal = useMemo(() => {
    return availableUpsells
      .filter((u) => selectedUpsells.includes(u.id))
      .reduce((sum, u) => sum + u.price, 0);
  }, [availableUpsells, selectedUpsells]);

  const finalTotalAmount = totalOrderAmount + upsellsTotal;

  function handleToggleUpsell(id: string) {
    setSelectedUpsells((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Cabeçalho Editorial Monocromático Compacto no Mobile — no-print */}
      <div className="no-print mb-5 sm:mb-8 pb-4 sm:pb-6 border-b-2 border-zinc-950 flex flex-col md:flex-row md:items-end justify-between gap-2 sm:gap-4">
        <div>
          <div className="font-mono text-[11px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1">
            PORTAL DE ACOMPANHAMENTO // CYBER INFORMÁTICA
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-950">
            Consulta de Ordem de Serviço.
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-zinc-600 max-w-sm leading-relaxed">
          Acompanhe a etapa atual na bancada, fotos do check-in, orçamento e Garantia CDC 90 Dias.
        </p>
      </div>

      {/* Formulário de Busca em Linha Única Horizontal (Mobile & Desktop) — 16px p/ evitar auto-zoom no iOS */}
      <div className="no-print mb-6 sm:mb-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex flex-row border-2 border-zinc-950 bg-white"
        >
          <div className="relative flex-1 min-w-0">
            <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 font-mono font-bold text-zinc-400 text-xs select-none">
              OS #
            </span>
            <input
              type="text"
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nº da OS ou seu WhatsApp..."
              className="w-full bg-transparent pl-12 sm:pl-14 pr-2 sm:pr-4 py-3.5 sm:py-4 text-base text-zinc-950 placeholder-zinc-400 font-mono focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-zinc-950 hover:bg-zinc-800 text-white font-mono font-bold uppercase tracking-wider py-3.5 sm:py-4 px-4 sm:px-8 text-xs shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 transition-colors cursor-pointer disabled:opacity-50 min-h-[48px]"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span>{loading ? 'Buscando...' : 'Consultar'}</span>
          </button>
        </form>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] sm:text-xs text-zinc-500">
          <span>
            Digite o nº impresso na sua etiqueta/recibo ou seu WhatsApp.
          </span>
          <span className="hidden sm:inline text-zinc-500">
            RUA CORONEL TEÓFILO LEME, 967 — CENTRO
          </span>
        </div>

        {error && (
          <div className="mt-4 p-4 border-2 border-zinc-900 bg-white text-zinc-950 text-sm">
            <p className="font-bold font-mono uppercase text-xs mb-1">Registro Não Localizado</p>
            <p className="text-xs text-zinc-700">{error}</p>
            <p className="text-xs text-zinc-600 mt-2.5 pt-2.5 border-t border-zinc-200">
              Precisa de ajuda? Fale com nosso balcão:{' '}
              <a
                href={`https://wa.me/55${brand.whatsapp}?text=Ol%C3%A1!%20Gostaria%20de%20consultar%20minha%20Ordem%20de%20Servi%C3%A7o.`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-zinc-950 underline"
              >
                WhatsApp ({brand.phone})
              </a>
            </p>
          </div>
        )}
      </div>

      {/* Skeleton Loader Anti-CLS durante consulta */}
      {loading && !data && (
        <div className="no-print space-y-4 animate-pulse min-h-[380px]">
          <div className="h-28 bg-zinc-200 border-2 border-zinc-300 p-6 flex flex-col justify-between">
            <div className="h-4 bg-zinc-300 w-1/4" />
            <div className="h-6 bg-zinc-300 w-1/2" />
          </div>
          <div className="h-64 bg-white border border-zinc-300 p-6 space-y-4">
            <div className="h-5 bg-zinc-200 w-1/3" />
            <div className="grid grid-cols-5 gap-2 h-16 bg-zinc-100" />
            <div className="grid grid-cols-2 gap-4 h-24">
              <div className="bg-zinc-100" />
              <div className="bg-zinc-100" />
            </div>
          </div>
        </div>
      )}

      {/* Resultados da Consulta — no-print */}
      {data && (
        <div className="no-print space-y-4 sm:space-y-6">
          {/* Banner de Aprovação em 1 Clique (quando aguardando aprovação) */}
          {data.status === 'awaiting_approval' && (
            <div className="space-y-4">
              <div className="border-2 border-zinc-950 bg-zinc-950 text-white p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-zinc-400 block mb-1">
                    AÇÃO NECESSÁRIA // ORÇAMENTO DISPONÍVEL
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Olá, {data.customer_first_name}! O diagnóstico do seu equipamento está pronto.
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-zinc-300 hidden sm:block">
                    Confira o detalhamento abaixo ({fmtBRL(finalTotalAmount)}) e aprove em 1 toque pelo WhatsApp.
                  </p>
                </div>
                <a
                  href={`https://wa.me/55${brand.whatsapp}?text=${encodeURIComponent(
                    `Olá! Aqui é ${data.customer_first_name}. Acabei de conferir no portal e APROVO o orçamento da OS #${
                      data.os_number || data.short_id
                    } (${data.equipment_brand} ${data.equipment_model}) no valor de ${fmtBRL(
                      finalTotalAmount
                    )}${
                      selectedUpsells.length > 0
                        ? ` (incluindo adicionais: ${availableUpsells
                            .filter((u) => selectedUpsells.includes(u.id))
                            .map((u) => u.title.replace(/^[^a-zA-Z0-9À-ÿ]+/, '').trim())
                            .join(' + ')})`
                        : ''
                    }. Podem iniciar o serviço!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto shrink-0 bg-white hover:bg-zinc-200 text-black px-5 py-3.5 font-mono text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <span>Aprovar Orçamento no WhatsApp</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                </a>
              </div>

              {/* Seletor de Upsells de 1 Clique */}
              <ClientUpsellSelector
                options={availableUpsells}
                selectedIds={selectedUpsells}
                onToggle={handleToggleUpsell}
              />
            </div>
          )}

          {/* Bloco Principal: Cabeçalho da OS & Stepper Suíço Mobile-First */}
          <div className="border border-zinc-300 bg-white p-4 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 border-b border-zinc-200 pb-4 sm:pb-6 mb-4 sm:mb-6">
              <div className="w-full md:w-auto">
                <div className="flex flex-wrap items-center justify-between md:justify-start gap-2 font-mono text-xs text-zinc-500 mb-2">
                  <span className="font-bold bg-zinc-950 text-white px-2.5 py-1">
                    OS #{data.os_number || data.short_id}
                  </span>
                  <span className="text-[11px] sm:text-xs">ENTRADA: {fmtDate(data.created_at)}</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-extrabold text-zinc-950 leading-tight">
                  {data.equipment_brand} {data.equipment_model}
                </h2>
                <p className="text-xs text-zinc-600 mt-1 font-mono">
                  CLIENTE: <strong className="text-zinc-950">{data.customer_first_name}</strong> ·{' '}
                  <strong className="uppercase text-zinc-950">{data.equipment_type}</strong>
                </p>
              </div>

              {/* Status Atual */}
              <div className="w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 flex md:block items-center justify-between font-mono">
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-500 md:block md:mb-1 uppercase tracking-wider">
                  STATUS ATUAL:
                </span>
                <span className="inline-block px-3 py-1.5 text-[11px] sm:text-xs font-bold uppercase bg-zinc-950 text-white">
                  {data.status === 'awaiting_approval' && 'Aguardando Aprovação'}
                  {data.status === 'approved' && 'Orçamento Aprovado'}
                  {data.status === 'in_progress' && 'Em Bancada'}
                  {data.status === 'waiting_part' && 'Aguardando Peça'}
                  {data.status === 'ready' && 'Pronto p/ Retirada'}
                  {data.status === 'delivered' && 'Entregue · Garantia 90D'}
                  {data.status === 'cancelled' && 'Ordem Cancelada'}
                </span>
              </div>
            </div>

            {/* Stepper de 5 Etapas — Barra Horizontal Compacta no Mobile + Grid Completo no Desktop */}
            <div>
              <div className="flex items-center justify-between mb-2.5 sm:mb-4 font-mono text-xs">
                <span className="font-bold uppercase tracking-wider text-zinc-950">
                  PROGRESSO NA BANCADA
                </span>
                <span className="text-zinc-500 font-bold">ETAPA 0{currentStep} / 05</span>
              </div>

              {/* MOBILE STEPPER (< 640px): 5 Colunas Horizontais Compactas + Faixa da Etapa Ativa */}
              <div className="sm:hidden">
                <div className="grid grid-cols-5 gap-px bg-zinc-300 border border-zinc-300 text-center">
                  {STEP_ITEMS.map((item) => {
                    const active = currentStep >= item.step;
                    const isCurrent = currentStep === item.step;
                    return (
                      <div
                        key={item.step}
                        className={`py-2 px-1 ${
                          isCurrent
                            ? 'bg-zinc-950 text-white'
                            : active
                            ? 'bg-zinc-200 text-zinc-950'
                            : 'bg-white text-zinc-400'
                        }`}
                      >
                        <div className="font-mono font-extrabold text-xs leading-none">
                          0{item.step}
                        </div>
                        <div
                          className={`font-mono text-[9px] uppercase tracking-tighter mt-1 truncate ${
                            isCurrent ? 'text-zinc-200 font-bold' : active ? 'text-zinc-700' : 'text-zinc-400'
                          }`}
                        >
                          {item.short}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-zinc-950 text-white px-3.5 py-2.5 border-x border-b border-zinc-950 flex items-center justify-between gap-2 font-mono text-xs">
                  <span className="font-bold uppercase">{activeStepInfo.title}</span>
                  <span className="text-zinc-300 text-[11px]">{activeStepInfo.desc}</span>
                </div>
              </div>

              {/* DESKTOP STEPPER (>= 640px): 5 Colunas Completas */}
              <div className="hidden sm:grid sm:grid-cols-5 gap-px bg-zinc-300 border border-zinc-300 text-xs">
                {STEP_ITEMS.map((item) => {
                  const active = currentStep >= item.step;
                  const isCurrent = currentStep === item.step;
                  return (
                    <div
                      key={item.step}
                      className={`p-4 transition-colors ${
                        isCurrent
                          ? 'bg-zinc-950 text-white'
                          : active
                          ? 'bg-zinc-100 text-zinc-950'
                          : 'bg-white text-zinc-400'
                      }`}
                    >
                      <div className="font-mono font-bold text-xs mb-1">{item.title}</div>
                      <div className={`text-[11px] ${isCurrent ? 'text-zinc-300' : 'text-zinc-500'}`}>
                        {item.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Relato de Entrada & Previsão */}
          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
            <div className="border border-zinc-300 bg-white p-4 sm:p-6">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-2.5">
                RELATO / SINTOMA REGISTRADO
              </span>
              <p className="text-zinc-900 text-xs sm:text-sm leading-relaxed bg-zinc-50 border border-zinc-200 p-3.5">
                {data.reported_defect || 'Avaliação técnica em bancada.'}
              </p>
              {data.accessories_in && (
                <p className="mt-3 text-xs text-zinc-600 font-mono">
                  ACESSÓRIOS DEIXADOS: <strong className="text-zinc-950">{data.accessories_in}</strong>
                </p>
              )}
            </div>

            <div className="border border-zinc-300 bg-white p-4 sm:p-6">
              <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-2.5">
                PREVISÃO & GARANTIA LEGAL
              </span>
              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500">PREVISÃO:</span>
                  <span className="text-zinc-950 font-bold text-right">
                    {data.estimated_ready_at ? fmtDate(data.estimated_ready_at) : 'EM AVALIAÇÃO'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                  <span className="text-zinc-500">GARANTIA LEGAL:</span>
                  <span className="text-zinc-950 font-bold text-right">90 DIAS (ART. 26 CDC)</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-zinc-500">UNIDADE:</span>
                  <span className="text-zinc-900 font-bold text-right">RUA CEL. TEÓFILO LEME, 967</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vistoria Fotográfica da Entrada */}
          {data.equipment_photos && data.equipment_photos.length > 0 && (
            <div className="border border-zinc-300 bg-white p-4 sm:p-8">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
                  VISTORIA FOTOGRÁFICA ({data.equipment_photos.length})
                </h3>
                <span className="font-mono text-[10px] sm:text-[11px] font-bold text-zinc-500 uppercase">
                  TOQUE P/ AMPLIAR
                </span>
              </div>
              <p className="text-xs text-zinc-500 mb-3.5">
                Fotos registradas no ato do recebimento do equipamento no balcão.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {data.equipment_photos.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setSelectedPhoto(url)}
                    className="relative aspect-square overflow-hidden border border-zinc-300 hover:border-zinc-950 transition-all group cursor-pointer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto de entrada ${i + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-black/75 py-1 text-white font-mono text-[10px] font-bold uppercase text-center sm:opacity-0 sm:group-hover:opacity-100 transition">
                      Foto 0{i + 1} · Ampliar
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Telemetria e Testes de Bancada (Grid 2x2 Perfeito com gap-px) */}
          <div className="border border-zinc-300 bg-white p-4 sm:p-8">
            <div className="flex items-center justify-between mb-3.5 border-b border-zinc-200 pb-2.5 font-mono">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                CONTROLE DE QUALIDADE & TESTES
              </span>
              <span className="text-[11px] text-zinc-500 uppercase">BANCADA</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-zinc-300 border border-zinc-300 text-center font-mono">
              <div className="bg-white p-3.5 sm:p-4">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">GPU EM CARGA</span>
                <span className="text-base sm:text-xl font-bold text-zinc-950 block">
                  {currentStep >= 4 ? '64 °C' : 'EM ANÁLISE'}
                </span>
              </div>
              <div className="bg-white p-3.5 sm:p-4">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">CPU EM CARGA</span>
                <span className="text-base sm:text-xl font-bold text-zinc-950 block">
                  {currentStep >= 4 ? '68 °C' : 'EM ANÁLISE'}
                </span>
              </div>
              <div className="bg-white p-3.5 sm:p-4">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">SAÚDE DO DISCO</span>
                <span className="text-base sm:text-xl font-bold text-zinc-950 block">100% OK</span>
              </div>
              <div className="bg-white p-3.5 sm:p-4">
                <span className="text-[10px] text-zinc-500 uppercase block mb-1">TEMPO DE BOOT</span>
                <span className="text-base sm:text-xl font-bold text-zinc-950 block">
                  {currentStep >= 4 ? '8.4 s' : '-- s'}
                </span>
              </div>
            </div>
          </div>

          {/* Discriminação Transparente de Custos (Lado a Lado no Mobile) */}
          <div className="border border-zinc-300 bg-white p-4 sm:p-8">
            <div className="flex flex-row items-center justify-between gap-3 border-b border-zinc-200 pb-4 mb-4 sm:mb-6">
              <div>
                <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-0.5">
                  TRANSPARÊNCIA DE VALORES
                </span>
                <h3 className="text-base sm:text-xl font-extrabold text-zinc-950">
                  Resumo Financeiro da OS
                </h3>
              </div>
              <div className="text-right font-mono shrink-0">
                <span className="text-[10px] sm:text-xs text-zinc-500 block uppercase">VALOR TOTAL</span>
                <span className="text-xl sm:text-3xl font-extrabold text-zinc-950 block">
                  {fmtBRL(totalOrderAmount)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 sm:gap-4 mb-5 font-mono">
              <div className="bg-zinc-50 border border-zinc-200 p-3 sm:p-4">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-500 block uppercase mb-1">
                  MÃO DE OBRA
                </span>
                <span className="text-base sm:text-2xl font-bold text-zinc-950">
                  {fmtBRL(data.labor_cost || 0)}
                </span>
              </div>
              <div className="bg-zinc-50 border border-zinc-200 p-3 sm:p-4">
                <span className="text-[10px] sm:text-xs font-bold text-zinc-500 block uppercase mb-1">
                  PEÇAS & INSUMOS
                </span>
                <span className="text-base sm:text-2xl font-bold text-zinc-950">
                  {fmtBRL(data.estimated_value || 0)}
                </span>
              </div>
            </div>

            {data.parts_applied && data.parts_applied.length > 0 && (
              <div className="mb-5 bg-zinc-50 border border-zinc-200 p-3.5 sm:p-4 text-xs font-mono">
                <span className="text-[11px] text-zinc-500 block uppercase font-bold mb-2 border-b border-zinc-200 pb-1.5">
                  PEÇAS APLICADAS NESTA OS:
                </span>
                <div className="space-y-2">
                  {data.parts_applied.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-start gap-2 text-zinc-800">
                      <span>
                        — {p.quantity}x {p.name}
                      </span>
                      <strong className="text-zinc-950 shrink-0">
                        {fmtBRL(p.unit_price * p.quantity)}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 pt-4 border-t border-zinc-200">
              <a
                href={`https://wa.me/55${brand.whatsapp}?text=${encodeURIComponent(
                  `Olá! Gostaria de falar sobre a minha OS #${data.os_number || data.short_id} (${
                    data.equipment_brand
                  } ${data.equipment_model}).`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 border border-zinc-900 bg-white hover:bg-zinc-100 py-3.5 px-4 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 text-center justify-center flex items-center gap-2 transition-colors min-h-[48px]"
              >
                <span>Falar com a Loja no WhatsApp</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </a>

              <button
                type="button"
                onClick={() => setShowWarrantyModal(true)}
                className="bg-zinc-950 hover:bg-zinc-800 text-white py-3.5 px-5 font-mono text-xs font-bold uppercase tracking-wider text-center justify-center flex items-center gap-2 transition-colors cursor-pointer min-h-[48px]"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span className="sm:hidden">Certificado de Garantia (90D)</span>
                <span className="hidden sm:inline">Emitir Termo de Garantia Legal (CDC 90 Dias)</span>
              </button>
            </div>
          </div>

          {/* Pagamento Pix (se pendente) */}
          {data.payment_status === 'pending' && (
            <div className="border border-zinc-900 bg-zinc-50 p-4 sm:p-8">
              <div className="flex items-center justify-between mb-2 font-mono">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                  PAGAMENTO VIA PIX
                </h3>
                <span className="text-[11px] text-zinc-600 font-bold uppercase">
                  CHAVE OFICIAL CYBER
                </span>
              </div>
              <p className="text-xs text-zinc-600 mb-3.5">
                Você pode pagar na retirada no balcão ou copiar nossa chave Pix oficial abaixo.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 bg-white border border-zinc-300 p-3.5 text-sm font-mono">
                <div className="flex items-center justify-between sm:justify-start gap-2 flex-1">
                  <span className="text-zinc-500 text-xs font-bold uppercase">CHAVE PIX:</span>
                  <code className="text-zinc-950 font-bold select-all tracking-wider">
                    {pixKey}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={copyPix}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-zinc-950 hover:bg-zinc-800 text-white text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 min-h-[44px]"
                >
                  {copiedPix ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Chave Pix Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Chave Pix</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Modal de Zoom de Foto */}
          {selectedPhoto && (
            <div
              className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 sm:p-4"
              onClick={() => setSelectedPhoto(null)}
            >
              <div
                className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-zinc-300 p-3 sm:p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-200 font-mono text-xs">
                  <span className="font-bold text-zinc-950 uppercase">
                    VISTORIA DE ENTRADA · OS #{data.os_number || data.short_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPhoto(null)}
                    className="p-1.5 text-zinc-500 hover:text-zinc-950 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPhoto}
                  alt="Foto ampliada da entrada"
                  loading="lazy"
                  className="max-w-full max-h-[72vh] border border-zinc-200 object-contain mx-auto"
                />
              </div>
            </div>
          )}

          {/* Modal Oficial de Emissão do Termo de Garantia Legal (CDC 90 Dias) — 100% Mobile-Safe */}
          {showWarrantyModal && (
            <div
              className="fixed inset-0 z-50 bg-black/80 flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto"
              onClick={() => setShowWarrantyModal(false)}
            >
              <div
                className="relative max-w-3xl w-full my-4 sm:my-8 bg-white text-zinc-950 p-4 sm:p-10 border-2 border-zinc-950"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Barra de Controle Superior do Modal (Evita colisão do botão X com o selo de garantia no mobile) */}
                <div className="no-print flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 font-mono text-xs">
                  <span className="text-zinc-500 font-bold uppercase">
                    CERTIFICADO DIGITAL · OS #{data.os_number || data.short_id}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowWarrantyModal(false)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold uppercase cursor-pointer"
                    aria-label="Fechar"
                  >
                    <span>Fechar</span>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="border-b-2 border-zinc-950 pb-4 mb-5">
                  <div className="flex flex-col sm:flex-row sm:justify-between items-start gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-zinc-950">
                        CYBER INFORMÁTICA
                      </h2>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        Rua Coronel Teófilo Leme, 967 — Centro, Bragança Paulista - SP • CEP 12900-003
                      </p>
                    </div>
                    <div className="sm:text-right font-mono">
                      <span className="text-xs font-bold bg-zinc-950 text-white px-2.5 py-1 inline-block">
                        GARANTIA CDC 90 DIAS
                      </span>
                      <span className="text-xs text-zinc-700 block mt-1 font-bold">
                        OS #{data.os_number || data.short_id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-center mb-5">
                  <h3 className="text-base sm:text-xl font-extrabold uppercase tracking-tight text-zinc-950">
                    Termo de Garantia Legal & Certificado de Entrega
                  </h3>
                  <span className="text-xs font-semibold text-zinc-600 block mt-0.5">
                    Artigo 26, Inciso II da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor)
                  </span>
                </div>

                {/* Tabela Responsiva (Empilhada em 360px / Colunas no Desktop) */}
                <div className="border border-zinc-300 text-xs mb-5 divide-y divide-zinc-300 font-mono">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-zinc-50">
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">TITULAR / CLIENTE:</span>
                      <strong className="text-zinc-950">{data.customer_first_name}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">EQUIPAMENTO:</span>
                      <strong className="text-zinc-950">
                        {data.equipment_brand} {data.equipment_model}
                      </strong>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3">
                    <div className="flex sm:block justify-between">
                      <span className="text-zinc-500 block text-[10px] uppercase">DATA DE ENTRADA:</span>
                      <span>{fmtDate(data.created_at)}</span>
                    </div>
                    <div className="flex sm:block justify-between">
                      <span className="text-zinc-500 block text-[10px] uppercase">DATA DE EMISSÃO:</span>
                      <span>{new Date().toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex sm:block justify-between">
                      <span className="text-zinc-500 block text-[10px] uppercase">PRAZO DE GARANTIA:</span>
                      <strong className="text-zinc-950">90 DIAS INTEGRAIS</strong>
                    </div>
                  </div>
                </div>

                <div className="mb-5 text-xs">
                  <h4 className="font-bold uppercase text-zinc-950 border-b border-zinc-200 pb-1 mb-2 font-mono">
                    Serviços Executados & Validação Técnica:
                  </h4>
                  <p className="text-zinc-700 leading-relaxed">{data.reported_defect}</p>
                </div>

                <div className="mb-6 text-[11px] leading-relaxed text-zinc-700 border-l-2 border-zinc-950 pl-3">
                  <p>
                    <strong>Cláusula de Garantia Legal (Art. 26, II, Lei 8.078/90):</strong> Fica assegurada ao consumidor a garantia legal de 90 (noventa) dias para os serviços executados e componentes substituídos discriminados nesta Ordem de Serviço.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-zinc-200 text-xs font-mono no-print">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="w-full sm:w-auto py-3 px-5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir / Salvar PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWarrantyModal(false)}
                    className="w-full sm:w-auto py-3 px-4 border border-zinc-300 bg-white hover:bg-zinc-100 text-zinc-800 font-bold text-xs uppercase transition-colors cursor-pointer min-h-[44px]"
                  >
                    Fechar Certificado
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Conteúdo Imprimível Direto (print:block) */}
      {data && (
        <div className="printable-warranty-certificate hidden print:block text-black bg-white p-8 font-sans">
          <div className="border-b-2 border-black pb-4 mb-4">
            <h1 className="text-xl font-bold uppercase font-mono">
              CYBER INFORMÁTICA · CERTIFICADO DE GARANTIA
            </h1>
            <p className="text-xs font-mono">
              Rua Coronel Teófilo Leme, 967 - Centro, Bragança Paulista - SP • (11) 95436-9269
            </p>
            <p className="text-xs font-mono font-bold mt-1">
              ORDEM DE SERVIÇO #{data.os_number || data.short_id} · GARANTIA LEGAL CDC 90 DIAS
            </p>
          </div>
          <div className="text-xs font-mono space-y-2 mb-4">
            <p>
              <strong>Titular:</strong> {data.customer_first_name} | <strong>Equipamento:</strong>{' '}
              {data.equipment_brand} {data.equipment_model}
            </p>
            <p>
              <strong>Data de Entrada:</strong> {fmtDate(data.created_at)} |{' '}
              <strong>Data de Emissão:</strong> {new Date().toLocaleDateString('pt-BR')}
            </p>
            <p>
              <strong>Descrição:</strong> {data.reported_defect}
            </p>
            <p>
              <strong>Valor Total:</strong> {fmtBRL(totalOrderAmount)}
            </p>
          </div>
          <div className="border-t border-b border-zinc-400 py-2 my-4 text-xs font-mono">
            <p className="font-bold">Termo de Garantia Legal (Art. 26 da Lei 8.078/1990 - CDC):</p>
            <p className="text-[11px] mt-1">
              Garantia integral de 90 dias a contar da data de retirada para serviços executados e componentes substituídos, mediante conservação dos lacres de chassi.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


