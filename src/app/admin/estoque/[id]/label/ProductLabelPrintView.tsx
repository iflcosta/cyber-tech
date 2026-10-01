'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Barcode } from '@/components/Barcode';
import { Printer, ArrowLeft, Plus, Minus, Tag } from 'lucide-react';

interface StockItemLabelData {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  category: string | null;
  ean13: string | null;
  internal_sku: string | null;
  shelf_location: string | null;
  unit_price: number;
  current_stock: number;
}

export function ProductLabelPrintView({ item }: { item: StockItemLabelData }) {
  const [copies, setCopies] = useState<number>(1);
  const [labelSize, setLabelSize] = useState<'58mm' | '50x30' | '80mm'>('58mm');
  const [showLocation, setShowLocation] = useState(true);
  const [showWarranty, setShowWarranty] = useState(true);

  const barcodeValue = item.ean13 || item.internal_sku || item.id.slice(0, 8).toUpperCase();
  const formattedPrice = item.unit_price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const copiesArray = Array.from({ length: Math.max(1, Math.min(100, copies)) });

  return (
    <>
      {/* Controles de Impressão na Tela (Ocultos na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl border-2 border-zinc-950 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              Térmica / Adesiva
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
              Etiqueta de Produto / Estoque
            </span>
          </div>
          <Link
            href={`/admin/estoque/${item.id}`}
            className="flex items-center gap-1 font-mono text-xs font-bold text-zinc-950 hover:underline underline-offset-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Produto</span>
          </Link>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {/* Seletor de Quantidade de Etiquetas */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-zinc-700 mb-1">
              Quantidade de Cópias (Etiquetas):
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCopies((c) => Math.max(1, c - 1))}
                className="flex h-9 w-9 items-center justify-center border-2 border-zinc-950 bg-zinc-100 font-bold hover:bg-zinc-200"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={1}
                max={100}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                className="h-9 w-20 border-2 border-zinc-950 text-center font-mono text-sm font-bold"
              />
              <button
                type="button"
                onClick={() => setCopies((c) => Math.min(100, c + 1))}
                className="flex h-9 w-9 items-center justify-center border-2 border-zinc-950 bg-zinc-100 font-bold hover:bg-zinc-200"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCopies(Math.max(1, item.current_stock))}
                className="border border-zinc-300 bg-zinc-50 px-2 py-1 text-[11px] font-mono text-zinc-600 hover:bg-zinc-100"
                title="Copiar saldo atual do estoque"
              >
                Todo Estoque ({item.current_stock})
              </button>
            </div>
          </div>

          {/* Formato de Papel / Rolo */}
          <div>
            <label className="block font-mono text-xs font-bold uppercase text-zinc-700 mb-1">
              Formato / Rolo da Impressora:
            </label>
            <select
              value={labelSize}
              onChange={(e) => setLabelSize(e.target.value as typeof labelSize)}
              className="h-9 w-full border-2 border-zinc-950 bg-white px-2 font-mono text-xs font-bold"
            >
              <option value="58mm">Bobina 58mm (MPT-II / POS-58 Contínua)</option>
              <option value="50x30">Etiqueta Adesiva 50x30mm / 40x25mm (Gôndola)</option>
              <option value="80mm">Bobina 80mm (Cupom / Gôndola Larga)</option>
            </select>
          </div>
        </div>

        {/* Opções extras */}
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-200 pt-3 text-xs font-mono">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showLocation}
              onChange={(e) => setShowLocation(e.target.checked)}
              className="accent-zinc-950"
            />
            <span>Exibir Localização ({item.shelf_location || 'Estante'})</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showWarranty}
              onChange={(e) => setShowWarranty(e.target.checked)}
              className="accent-zinc-950"
            />
            <span>Exibir Garantia 90 Dias CDC</span>
          </label>
        </div>

        {/* Botão de Disparo */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t-2 border-zinc-950 pt-4">
          <div className="font-mono text-xs text-zinc-600">
            Pressione <strong>Ctrl + P</strong> ou clique no botão ao lado.
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-zinc-950 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-sm hover:bg-zinc-800 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir {copies} {copies === 1 ? 'Etiqueta' : 'Etiquetas'}</span>
          </button>
        </div>
      </div>

      {/* ============ ÁREA DE ETIQUETAS TÉRMICAS ============ */}
      <div className="flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
        {copiesArray.map((_, idx) => (
          <div
            key={idx}
            className={`product-label-thermal border-2 border-zinc-950 bg-white text-black font-mono print:border-0 ${
              idx > 0 ? 'print:break-before-page' : ''
            }`}
            style={{
              width: labelSize === '50x30' ? '50mm' : labelSize === '80mm' ? '80mm' : '58mm',
              padding: labelSize === '50x30' ? '1.5mm 2mm' : '2mm 3mm',
              margin: '0 auto',
              boxSizing: 'border-box',
            }}
          >
            {/* Cabeçalho da Loja */}
            <div className="text-center border-b border-black pb-0.5 mb-1">
              <span className="text-[10px] font-black tracking-widest uppercase">
                CYBER INFORMÁTICA
              </span>
            </div>

            {/* Nome do Produto */}
            <div className="py-0.5 text-center leading-tight">
              <div className="text-xs font-black uppercase tracking-tight break-words">
                {item.name}
              </div>
              {(item.brand || item.model) && (
                <div className="text-[9px] text-zinc-700 font-bold uppercase mt-0.5">
                  {[item.brand, item.model].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>

            {/* Código de Barras (JsBarcode SVG 100% nítido para leitor USB do PDV) */}
            <div className="my-1 border-t border-b border-black py-1 text-center">
              <Barcode
                value={barcodeValue}
                height={labelSize === '50x30' ? 28 : 34}
                width={labelSize === '50x30' ? 1.4 : 1.7}
                fontSize={9}
              />
              {item.internal_sku && item.ean13 && (
                <div className="text-[8px] font-bold text-zinc-600 mt-0.5">
                  SKU: {item.internal_sku}
                </div>
              )}
            </div>

            {/* Preço de Venda em Destaque */}
            <div className="text-center py-1 bg-black text-white my-1">
              <span className="text-sm font-black tracking-tight">
                {formattedPrice}
              </span>
              <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-300">
                À Vista ou Cartão
              </span>
            </div>

            {/* Rodapé: Localização + Garantia */}
            <div className="pt-0.5 flex items-center justify-between text-[8px] font-bold uppercase border-t border-black text-zinc-800">
              {showLocation && (
                <span className="truncate max-w-[60%]">
                  {item.shelf_location || 'BALCÃO'}
                </span>
              )}
              {showWarranty && <span>GARANTIA 90D</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Regras CSS de Impressão Direta na Térmica */}
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
          .product-label-thermal, .product-label-thermal * {
            visibility: visible;
          }
          .product-label-thermal {
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
