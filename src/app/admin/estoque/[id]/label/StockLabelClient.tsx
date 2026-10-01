'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Barcode128 } from '@/app/admin/components/Barcode128';

interface StockLabelProps {
  item: {
    id: string;
    name: string;
    brand: string | null;
    model: string | null;
    category: string | null;
    ean13: string | null;
    internal_sku: string | null;
    unit_price: number;
    shelf_location: string | null;
    notes: string | null;
  };
  monthYear: string;
}

export function StockLabelClient({ item, monthYear }: StockLabelProps) {
  const defaultSpecs = [item.brand, item.model, item.category]
    .filter(Boolean)
    .join(' · ');

  const fallbackSku = item.internal_sku || `CY-SKU-${item.id.slice(0, 6).toUpperCase()}`;

  const [labelFormat, setLabelFormat] = useState<'60x40' | '50x40'>('60x40');
  const [title, setTitle] = useState(item.name);
  const [specsLine, setSpecsLine] = useState(defaultSpecs || 'Pronta-Entrega · Garantia Loja');
  const [price, setPrice] = useState(
    item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  );
  const [codeSource, setCodeSource] = useState<'sku' | 'ean'>('sku');
  const [copies, setCopies] = useState(1);
  const [showPrice, setShowPrice] = useState(true);

  const activeBarcodeValue =
    codeSource === 'ean' && item.ean13 ? item.ean13 : fallbackSku;

  const copiesArray = Array.from({ length: Math.max(1, Math.min(50, copies)) });

  const labelWidthMm = labelFormat === '60x40' ? 60 : 50;

  return (
    <>
      {/* Painel de Configuração (Oculto na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl border-2 border-zinc-950 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              Knup KP-IM608 · {labelFormat}mm
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
              Etiqueta de Produto / PDV
            </span>
          </div>
          <Link
            href={`/admin/estoque/${item.id}`}
            className="font-mono text-xs font-bold text-zinc-950 underline underline-offset-4"
          >
            ← Voltar para o Item
          </Link>
        </div>

        {/* Seletor de Tamanho de Etiqueta */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-bold uppercase text-zinc-700 mr-1">
            Tamanho da Bobina:
          </span>
          <button
            type="button"
            onClick={() => setLabelFormat('60x40')}
            className={`px-3 py-1 font-mono text-xs font-bold uppercase border cursor-pointer ${
              labelFormat === '60x40'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            ⭐ 60x40 mm (Recomendado)
          </button>
          <button
            type="button"
            onClick={() => setLabelFormat('50x40')}
            className={`px-3 py-1 font-mono text-xs font-bold uppercase border cursor-pointer ${
              labelFormat === '50x40'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            50x40 mm
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">
              Nome do Produto na Etiqueta
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full border border-zinc-400 px-2.5 py-1.5 font-mono text-xs text-zinc-950"
            />
          </label>

          <label className="block">
            <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">
              Características / Marca / Modelo
            </span>
            <input
              type="text"
              value={specsLine}
              onChange={(e) => setSpecsLine(e.target.value)}
              placeholder="Ex: SATA III 2.5 · 500MB/s · Kingston"
              className="mt-1 w-full border border-zinc-400 px-2.5 py-1.5 font-mono text-xs text-zinc-950"
            />
          </label>

          <label className="block">
            <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">
              Valor de Venda (R$)
            </span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={!showPrice}
                className="w-full border border-zinc-400 px-2.5 py-1.5 font-mono text-xs font-bold text-zinc-950 disabled:opacity-40"
              />
              <label className="flex items-center gap-1 font-mono text-[11px] text-zinc-700 whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                />
                Exibir preço
              </label>
            </div>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">
                Código de Barras
              </span>
              <select
                value={codeSource}
                onChange={(e) => setCodeSource(e.target.value as 'sku' | 'ean')}
                className="mt-1 w-full border border-zinc-400 bg-white px-2 py-1.5 font-mono text-xs text-zinc-950"
              >
                <option value="sku">SKU ({fallbackSku})</option>
                {item.ean13 && <option value="ean">EAN ({item.ean13})</option>}
              </select>
            </label>

            <label className="block">
              <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">
                Qtd. Etiquetas
              </span>
              <input
                type="number"
                min={1}
                max={50}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="mt-1 w-full border border-zinc-400 px-2.5 py-1.5 font-mono text-xs font-bold text-zinc-950"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          <p className="font-mono text-[11px] text-zinc-600">
            Configure o papel da <strong>Knup KP-IM608</strong> como <strong>{labelFormat === '60x40' ? '60 x 40 mm' : '50 x 40 mm'}</strong> (Margens: Nenhuma / Escala: 100%).
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
          >
            🖨️ Imprimir {copies > 1 ? `${copies} Etiquetas` : 'Etiqueta'} ({labelFormat}mm)
          </button>
        </div>
      </div>

      {/* Área de Impressão (60x40mm ou 50x40mm) */}
      <div className="label-print-container flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
        {copiesArray.map((_, index) => (
          <div
            key={index}
            className="label-thermal-item border-2 border-dashed border-zinc-400 bg-white text-black shadow-sm print:border-0 print:shadow-none"
            style={{
              width: `${labelWidthMm}mm`,
              height: '39mm',
              padding: labelFormat === '60x40' ? '1.8mm 2.8mm' : '1.8mm 2.2mm',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
              pageBreakAfter: index < copiesArray.length - 1 ? 'always' : 'auto',
              breakAfter: index < copiesArray.length - 1 ? 'page' : 'auto',
            }}
          >
            {/* 1. Topo: Marca da Loja + Lote/Data */}
            <div className="flex items-center justify-between border-b border-black pb-[0.8mm] font-mono text-[6.5pt] font-bold uppercase leading-none">
              <span>CYBER INFORMÁTICA</span>
              <span>{item.shelf_location ? `${item.shelf_location} · ${monthYear}` : monthYear}</span>
            </div>

            {/* 2. Nome e Características do Produto */}
            <div className="my-[0.6mm] flex-1 flex flex-col justify-center overflow-hidden">
              <div
                className="font-sans text-[8.5pt] font-black uppercase leading-[1.08] text-black"
                style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title}
              </div>
              {specsLine && (
                <div className="mt-[0.5mm] truncate font-mono text-[6.2pt] font-bold uppercase text-black leading-none">
                  {specsLine}
                </div>
              )}
            </div>

            {/* 3. Preço em Destaque */}
            {showPrice && (
              <div className="my-[0.4mm] flex items-baseline justify-between border-y border-black py-[0.6mm] leading-none">
                <span className="font-mono text-[5.8pt] font-bold uppercase">VALOR:</span>
                <span className="font-mono text-[11.8pt] font-black tracking-tight text-black">
                  R$ {price}
                </span>
              </div>
            )}

            {/* 4. Código de Barras (Code 128) + SKU Interno */}
            <div className="pt-[0.4mm] text-center">
              <div className="mx-auto w-full">
                <Barcode128 value={activeBarcodeValue} height={showPrice ? 25 : 34} />
              </div>
              <div className="mt-[0.5mm] font-mono text-[6.2pt] font-bold tracking-wider uppercase leading-none text-black">
                {codeSource === 'sku' ? `SKU: ${activeBarcodeValue}` : `EAN: ${activeBarcodeValue}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @page {
          size: ${labelFormat === '60x40' ? '60mm 40mm' : '50mm 40mm'};
          margin: 0 !important;
        }
        @media print {
          html, body {
            width: ${labelWidthMm}mm !important;
            height: 40mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, footer, .no-print, [class*="print:hidden"] {
            display: none !important;
          }
          body > div, main {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            max-width: none !important;
            width: ${labelWidthMm}mm !important;
            display: block !important;
          }
          .label-print-container {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: ${labelWidthMm}mm !important;
          }
          .label-thermal-item {
            width: ${labelWidthMm}mm !important;
            height: 39mm !important;
            max-width: ${labelWidthMm}mm !important;
            max-height: 39mm !important;
            margin: 0 !important;
            padding: ${labelFormat === '60x40' ? '1.8mm 2.8mm' : '1.8mm 2.2mm'} !important;
            border: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .label-thermal-item:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
        }
      `}</style>
    </>
  );
}