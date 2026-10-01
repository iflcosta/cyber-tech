'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Barcode } from '@/components/Barcode';
import { Printer, ArrowLeft, Plus, Minus, QrCode, Tag, CheckSquare } from 'lucide-react';
import { EscPosLabelButton } from './EscPosLabelButton';

export interface OSLabelData {
  id: string;
  shortId: string;
  osNumberStr: string;
  created: string;
  destination: string;
  customerName: string;
  customerPhone: string;
  typeLabel: string;
  equipNorm: string;
  serial?: string | null;
  defectNorm: string;
  accessories?: string | null;
  password?: string | null;
  qrDataUrl: string;
  trackingUrl: string;
}

export function OSLabelPrintView({ data }: { data: OSLabelData }) {
  const [copies, setCopies] = useState<number>(1);
  const [labelSize, setLabelSize] = useState<'58mm' | '50x30' | '80mm'>('58mm');
  const [showQr, setShowQr] = useState<boolean>(true);
  const [showBarcode, setShowBarcode] = useState<boolean>(true);
  const [showAccessories, setShowAccessories] = useState<boolean>(true);

  const copiesArray = Array.from({ length: Math.max(1, Math.min(10, copies)) });

  return (
    <>
      {/* Controles de Impressão na Tela (Ocultos na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl border-2 border-zinc-950 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              Bancada · Chassi
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
              Etiqueta de Entrada do Dispositivo (OS)
            </span>
          </div>
          <Link
            href={`/admin/os/${data.id}`}
            className="flex items-center gap-1 font-mono text-xs font-bold text-zinc-950 hover:underline underline-offset-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para OS</span>
          </Link>
        </div>

        {/* Controles de formato e cópias */}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-zinc-700 mb-1">
              Quantidade de Cópias:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCopies((c) => Math.max(1, c - 1))}
                className="flex h-9 w-9 items-center justify-center border-2 border-zinc-950 bg-zinc-100 font-bold hover:bg-zinc-200 cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                max={10}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="h-9 w-16 border-2 border-zinc-950 text-center font-mono text-sm font-bold"
              />
              <button
                type="button"
                onClick={() => setCopies((c) => Math.min(10, c + 1))}
                className="flex h-9 w-9 items-center justify-center border-2 border-zinc-950 bg-zinc-100 font-bold hover:bg-zinc-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-zinc-500">
                (ex: 1 p/ Chassi + 1 p/ Fonte/Carregador)
              </span>
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs font-bold uppercase text-zinc-700 mb-1">
              Tamanho do Rolo / Etiqueta:
            </label>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as typeof labelSize)}
              className="h-9 w-full border-2 border-zinc-950 bg-white px-2 font-mono text-xs font-bold"
            >
              <option value="58mm">Bobina Térmica 58mm (Padrão Bancada)</option>
              <option value="50x30">Etiqueta Adesiva 50x30mm (Compacta)</option>
              <option value="80mm">Bobina Térmica 80mm (Larga)</option>
            </select>
          </div>
        </div>

        {/* Toggles de elementos visuais */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-3 text-xs font-mono">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showBarcode}
              onChange={(e) => setShowBarcode(e.target.checked)}
              className="accent-zinc-950"
            />
            <span>Código de Barras (Leitor USB)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showQr}
              onChange={(e) => setShowQr(e.target.checked)}
              className="accent-zinc-950"
            />
            <span>QR Code (Rastreio Cliente)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showAccessories}
              onChange={(e) => setShowAccessories(e.target.checked)}
              className="accent-zinc-950"
            />
            <span>Acessórios &amp; Senha</span>
          </label>
        </div>

        {/* Botões de Ação */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-zinc-950 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-zinc-950 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-zinc-800 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir {copies} {copies === 1 ? 'Etiqueta' : 'Etiquetas'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <EscPosLabelButton
              createdStr={data.created}
              shortId={data.shortId}
              osNumber={data.osNumberStr}
              customerName={data.customerName}
              customerPhone={data.customerPhone || undefined}
              equipmentLine={data.typeLabel || data.equipNorm ? `${data.typeLabel}${data.equipNorm ? ' - ' + data.equipNorm : ''}` : undefined}
              defect={data.defectNorm || undefined}
            />
          </div>
        </div>
      </div>

      {/* ============ ETIQUETA TÉRMICA (PRINT READY) ============ */}
      <div className="flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
        {copiesArray.map((_, idx) => (
          <div
            key={idx}
            className={`label-thermal border-2 border-zinc-950 bg-white text-black font-mono print:border-0 ${
              idx > 0 ? 'print:break-before-page' : ''
            }`}
            style={{
              width: labelSize === '50x30' ? '50mm' : labelSize === '80mm' ? '80mm' : '58mm',
              padding: labelSize === '50x30' ? '1.5mm 2mm' : '2mm 3mm',
              margin: '0 auto',
              boxSizing: 'border-box',
            }}
          >
            {/* Cabeçalho */}
            <div className="text-center text-[10px] tracking-widest font-black border-b border-black pb-0.5 mb-1">
              CYBER INFORMÁTICA · {data.created}
            </div>

            {/* Destaque Gigante da OS e Destino de Bancada */}
            <div className="text-center py-1 border-b-2 border-black my-0.5">
              <div className="text-2xl font-black tracking-tight leading-none">{data.shortId}</div>
              <div className="text-xs font-bold mt-0.5">OS: #{data.osNumberStr}</div>
              <div className="text-[10px] font-mono font-black uppercase mt-1 px-1.5 py-0.5 bg-black text-white inline-block">
                {data.destination}
              </div>
            </div>

            {/* Código de barras USB (Code-128 para o leitor de bancada dar bip e abrir a OS) */}
            {showBarcode && (
              <div className="my-1 border-b border-dashed border-black pb-1 text-center">
                <Barcode
                  value={data.shortId}
                  height={labelSize === '50x30' ? 24 : 30}
                  width={labelSize === '50x30' ? 1.4 : 1.6}
                  fontSize={8}
                />
              </div>
            )}

            {/* Cliente */}
            <div className="border-b border-dashed border-black py-1 text-[11px] leading-tight">
              <div className="font-black uppercase text-[9px] text-zinc-700">[CLIENTE]</div>
              <div className="font-black truncate">{data.customerName}</div>
              {data.customerPhone && <div className="text-[10px] font-bold">Tel: {data.customerPhone}</div>}
            </div>

            {/* Aparelho */}
            <div className="border-b border-dashed border-black py-1 text-[11px] leading-tight">
              <div className="font-black uppercase text-[9px] text-zinc-700">[EQUIPAMENTO]</div>
              <div className="font-black break-words">
                {data.typeLabel} {data.equipNorm}
              </div>
              {data.serial && (
                <div className="text-[10px] font-bold">S/N: {data.serial}</div>
              )}
            </div>

            {/* Acessórios deixados no balcão e senha */}
            {showAccessories && (data.accessories || data.password) && (
              <div className="border-b border-dashed border-black py-1 text-[10px] leading-tight bg-zinc-50 px-1 my-0.5">
                {data.accessories && (
                  <div>
                    <strong className="text-[9px] uppercase">[ACESSÓRIOS]: </strong>
                    <span className="font-bold">{data.accessories}</span>
                  </div>
                )}
                {data.password && (
                  <div className="mt-0.5">
                    <strong className="text-[9px] uppercase">[SENHA/PIN]: </strong>
                    <span className="font-black bg-black text-white px-1">{data.password}</span>
                  </div>
                )}
              </div>
            )}

            {/* Defeito Relatado */}
            {data.defectNorm && (
              <div className="border-b border-dashed border-black py-1 text-[10px] leading-tight">
                <div className="font-black uppercase text-[9px] text-zinc-700">[DEFEITO / SERVIÇO]</div>
                <div className="break-words font-medium">{data.defectNorm}</div>
              </div>
            )}

            {/* QR Code de Rastreio do Cliente */}
            {showQr && (
              <div className="pt-1 flex items-center justify-between gap-2 border-t border-black mt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.qrDataUrl}
                  alt="QR Code Rastreio"
                  className="w-14 h-14 border border-black p-0.5 shrink-0"
                />
                <div className="text-left text-[9px] leading-tight uppercase font-bold">
                  <div>Rastreio Online:</div>
                  <div className="font-black text-[10px] mt-0.5">cyberinformatica.tech</div>
                  <div className="text-[8px] text-zinc-600 mt-0.5">Aponte a câmera</div>
                </div>
              </div>
            )}

            {!showQr && (
              <div className="pt-1 text-center text-[9px] leading-tight font-bold uppercase">
                <div>RASTREIO: cyberinformatica.tech</div>
                <div className="text-[10px] font-black mt-0.5">DIGITE A OS: {data.osNumberStr}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @page {
          size: ${labelSize === '50x30' ? '50mm 30mm' : labelSize === '80mm' ? '80mm auto' : '58mm auto'};
          margin: 0;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
          }
          body * {
            visibility: hidden;
          }
          .label-thermal, .label-thermal * {
            visibility: visible;
          }
          .label-thermal {
            position: relative;
            margin: 0 auto !important;
            padding: ${labelSize === '50x30' ? '1.5mm 2mm' : '2mm 2.5mm'} !important;
            background: white !important;
            color: black !important;
            width: ${labelSize === '50x30' ? '50mm' : labelSize === '80mm' ? '80mm' : '58mm'} !important;
            box-shadow: none !important;
            border: 0 !important;
            page-break-after: always;
            break-after: page;
          }
        }
      `}</style>
    </>
  );
}
