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

  const labelWidthMm = 40;
  const labelHeightMm = 52;

  // Função de impressão isolada para garantir 1 página única no Microsoft Edge
  const handlePrint = () => {
    const frameId = 'thermal-label-print-frame';
    let frame = document.getElementById(frameId) as HTMLIFrameElement | null;
    if (frame) {
      frame.remove();
    }
    frame = document.createElement('iframe');
    frame.id = frameId;
    frame.style.position = 'fixed';
    frame.style.right = '0';
    frame.style.bottom = '0';
    frame.style.width = '0';
    frame.style.height = '0';
    frame.style.border = '0';
    frame.style.visibility = 'hidden';
    document.body.appendChild(frame);

    const doc = frame.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const labelContainer = document.querySelector('.label-print-container');
    const labelHtml = labelContainer ? labelContainer.innerHTML : '';

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="utf-8">
          <title>Etiqueta 40x60mm</title>
          <style>
            @page {
              size: 40mm 60mm;
              margin: 0 !important;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            html, body {
              width: 40mm !important;
              height: 60mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #000000 !important;
              overflow: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .label-thermal-item {
              width: 40mm !important;
              height: 52mm !important;
              max-height: 52mm !important;
              margin: 0 !important;
              padding: 1.8mm 1.8mm 1.5mm 1.8mm !important;
              border: 0 !important;
              box-shadow: none !important;
              background: #ffffff !important;
              color: #000000 !important;
              display: flex !important;
              flex-direction: column !important;
              justify-content: space-between !important;
              overflow: hidden !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              page-break-after: always;
              break-after: page;
            }
            .label-thermal-item:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }
          </style>
        </head>
        <body>
          ${labelHtml}
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        frame?.contentWindow?.focus();
        frame?.contentWindow?.print();
      } catch {
        window.print();
      }
    }, 200);
  };

  return (
    <>
      {/* Painel de Configuração (Oculto na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl border-2 border-zinc-950 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              Knup KP-IM608 · 40x60mm
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

        {/* Indicador de Formato Único (40x60mm) */}
        <div className="mt-3 flex items-center gap-2 rounded bg-zinc-100 px-3 py-1.5 font-mono text-xs text-zinc-800 border border-zinc-300">
          <span className="font-bold uppercase text-zinc-950">Formato da Bobina:</span>
          <span>📱 40 x 60 mm (Em Pé / Retrato)</span>
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
                <option value="sku">SKU Interno ({fallbackSku})</option>
                <option value="ean" disabled={!item.ean13}>
                  EAN-13 {item.ean13 ? `(${item.ean13})` : '(Não cadastrado)'}
                </option>
              </select>
            </label>

            <label className="block">
              <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">
                Qtd. Cópias
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

        {/* Guia de Configuração Crítica do Microsoft Edge */}
        <div className="mt-4 rounded border-2 border-blue-500 bg-blue-50 p-3 text-xs text-blue-950">
          <div className="flex items-center gap-1.5 font-bold text-blue-900">
            <span className="text-base">ℹ️</span> Passo a passo para o Microsoft Edge imprimir em 1 página só:
          </div>
          <ol className="mt-1.5 list-decimal pl-4 space-y-1 font-mono text-[11px] text-blue-950">
            <li>Na tela de impressão, selecione a impressora <strong>LABEL</strong> (Knup KP-IM608).</li>
            <li>Clique em <strong>Mais configurações</strong> (More settings).</li>
            <li>No campo <strong>Tamanho do papel</strong>, selecione <strong>USER</strong> (ou 40x60).</li>
            <li>No campo <strong>Margens</strong>, mude para <strong>"Nenhuma"</strong> (None).</li>
            <li><strong>Desmarque</strong> a caixinha <strong>"Cabeçalhos e rodapés"</strong>.</li>
            <li>Confira se a visualização indica <strong>Páginas: 1</strong> e clique em Imprimir!</li>
          </ol>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          <p className="font-mono text-[11px] text-zinc-600">
            Bobina: <strong>40 x 60 mm (Em Pé / Retrato)</strong>
          </p>
          <button
            type="button"
            onClick={handlePrint}
            className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
          >
            🖨️ Imprimir {copies > 1 ? `${copies} Etiquetas` : 'Etiqueta'} (40x60mm)
          </button>
        </div>
      </div>

      {/* Área de Impressão (40x60mm Vertical) */}
      <div className="label-print-container flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
        {copiesArray.map((_, index) => (
          <div
            key={index}
            className="label-thermal-item border-2 border-dashed border-zinc-400 bg-white text-black shadow-sm print:border-0 print:shadow-none"
            style={{
              width: `${labelWidthMm}mm`,
              height: `${labelHeightMm}mm`,
              padding: '1.8mm 1.8mm 1.5mm 1.8mm',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              pageBreakAfter: index < copiesArray.length - 1 ? 'always' : 'auto',
              breakAfter: index < copiesArray.length - 1 ? 'page' : 'auto',
            }}
          >
            {/* 1. Topo: Marca da Loja + Lote/Data */}
            <div className="flex items-center justify-between border-b border-black pb-[0.3mm] font-mono text-[6pt] font-black uppercase leading-none">
              <span>CYBER INFORMÁTICA</span>
              <span>{item.shelf_location ? `${item.shelf_location} · ${monthYear}` : monthYear}</span>
            </div>

            {/* 2. Nome e Características do Produto */}
            <div className="flex flex-col justify-center overflow-hidden">
              <div
                className="font-sans text-[8.2pt] font-black uppercase leading-[1.08] text-black"
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
                <div className="mt-[0.3mm] truncate font-mono text-[5.2pt] font-bold uppercase text-black leading-tight">
                  {specsLine}
                </div>
              )}
            </div>

            {/* 3. Selo de Garantia da Loja (1 Linha Perfeita, sem quebra da estrela) */}
            <div className="border border-black bg-white py-[0.4mm] px-[0.5mm] text-center font-mono text-[4.8pt] font-black uppercase tracking-normal text-black leading-none whitespace-nowrap">
              ✦ GARANTIA DE 90 DIAS LOJA ✦
            </div>

            {/* 4. Preço em Destaque (Box Fechado com Hierarquia Visual) */}
            {showPrice && (
              <div className="border-2 border-black py-[0.6mm] px-[1mm] text-center bg-white">
                <div className="font-mono text-[5pt] font-black uppercase tracking-wider text-black leading-none">
                  VALOR À VISTA / PIX
                </div>
                <div className="my-[0.3mm] font-mono font-black tracking-tight leading-none text-black">
                  <span className="text-[8pt] font-black align-baseline mr-[0.5mm]">R$</span>
                  <span className="text-[13pt] font-black">{price}</span>
                </div>
                <div className="font-mono text-[4.5pt] font-bold uppercase text-black leading-none">
                  Consulte parcelamento no cartão
                </div>
              </div>
            )}

            {/* 5. Código de Barras (Altura 28px) + SKU */}
            <div className="text-center">
              <div className="mx-auto w-full flex justify-center">
                <Barcode128
                  value={activeBarcodeValue}
                  height={showPrice ? 28 : 36}
                />
              </div>
              <div className="mt-[0.4mm] font-mono text-[5.8pt] font-black tracking-wider uppercase leading-none text-black">
                {codeSource === 'sku' ? `SKU: ${activeBarcodeValue}` : `EAN: ${activeBarcodeValue}`}
              </div>
            </div>

            {/* 6. Rodapé da Loja */}
            <div className="border-t border-black pt-[0.3mm] text-center font-mono text-[4.8pt] font-bold uppercase text-black leading-none truncate whitespace-nowrap">
              cyberinformatica.tech · Loja
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @page {
          size: 40mm 60mm;
          margin: 0 !important;
        }
        @media print {
          @page {
            size: 40mm 60mm;
            margin: 0 !important;
          }
          html, body {
            width: 40mm !important;
            height: 60mm !important;
            max-height: 60mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          .label-print-container,
          .label-print-container * {
            visibility: visible !important;
          }
          .label-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 40mm !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          .label-thermal-item {
            width: 40mm !important;
            height: 52mm !important;
            max-width: 40mm !important;
            max-height: 52mm !important;
            margin: 0 !important;
            padding: 1.8mm 1.8mm 1.5mm 1.8mm !important;
            border: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            position: relative !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: always;
            break-after: page;
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