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

  const [labelFormat, setLabelFormat] = useState<'40x60' | '40x60-landscape' | '60x40' | '50x40'>('40x60-landscape');
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

  const is40x60Landscape = labelFormat === '40x60-landscape';
  const is40x60Any = labelFormat === '40x60' || is40x60Landscape;

  const labelWidthMm = labelFormat === '60x40' ? 60 : (is40x60Any ? 40 : 50);
  const labelHeightMm = is40x60Any ? 59 : 39;
  const paperHeightMm = is40x60Any ? 60 : 40;

  return (
    <>
      {/* Painel de Configuração (Oculto na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl border-2 border-zinc-950 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              Knup KP-IM608 · {is40x60Landscape ? '40x60 Paisagem (De Lado)' : `${labelFormat}mm`}
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
            Formato / Bobina:
          </span>
          <button
            type="button"
            onClick={() => setLabelFormat('40x60-landscape')}
            className={`px-3 py-1 font-mono text-xs font-bold uppercase border cursor-pointer ${
              labelFormat === '40x60-landscape'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            🔄 40x60 mm De Lado (Paisagem / Estilo 60x40)
          </button>
          <button
            type="button"
            onClick={() => setLabelFormat('40x60')}
            className={`px-3 py-1 font-mono text-xs font-bold uppercase border cursor-pointer ${
              labelFormat === '40x60'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            📱 40x60 mm Em Pé (Vertical / Retrato)
          </button>
          <button
            type="button"
            onClick={() => setLabelFormat('60x40')}
            className={`px-3 py-1 font-mono text-xs font-bold uppercase border cursor-pointer ${
              labelFormat === '60x40'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            60x40 mm (Bobina Horizontal)
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

        {/* Alerta de Configuração Crítica do Chrome */}
        <div className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
          <div className="flex items-center gap-1.5 font-bold text-amber-900">
            <span className="text-base">⚠️</span> Para não gerar 3 páginas nem cortar a etiqueta:
          </div>
          <ol className="mt-1.5 list-decimal pl-4 space-y-1 font-mono text-[11px] text-amber-900">
            <li>No diálogo de impressão do Chrome, clique em <strong>Mais definições</strong> (More settings).</li>
            <li><strong>Desmarque</strong> a opção <strong>"Cabeçalhos e rodapés"</strong> (isso remove data e URL que empurram o conteúdo para 3 páginas).</li>
            <li>Altere <strong>Margens</strong> para <strong>"Nenhuma"</strong> (None).</li>
            <li>Altere <strong>Escala</strong> para <strong>100%</strong> (Padrão).</li>
          </ol>
          <p className="mt-1 text-[10px] text-amber-800">
            <em>O Chrome memoriza essas escolhas para a sua impressora KP-IM608, você só precisa configurar uma única vez!</em>
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          <p className="font-mono text-[11px] text-zinc-600">
            Papel da <strong>Knup KP-IM608</strong>: <strong>{is40x60Landscape ? '40 x 60 mm (Paisagem / Girada 90°)' : (labelFormat === '40x60' ? '40 x 60 mm (Vertical)' : (labelFormat === '60x40' ? '60 x 40 mm' : '50 x 40 mm'))}</strong>.
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
          >
            🖨️ Imprimir {copies > 1 ? `${copies} Etiquetas` : 'Etiqueta'} ({is40x60Landscape ? '40x60 De Lado' : `${labelFormat}mm`})
          </button>
        </div>
      </div>

      {/* Dica visual informativa sobre o Modo Paisagem */}
      {is40x60Landscape && (
        <div className="print:hidden mx-auto mb-4 max-w-2xl rounded border border-blue-200 bg-blue-50 px-3 py-2 text-center font-mono text-[11px] text-blue-900">
          🔄 <strong>Modo Paisagem Ativo:</strong> A etiqueta sai <strong>girada 90° de lado</strong> na bobina de 40mm. Ao colar no produto, você cola na <strong>horizontal (60mm de largura × 40mm de altura)</strong>!
        </div>
      )}

      {/* Área de Impressão (40x60mm, 60x40mm ou 50x40mm) */}
      <div className="label-print-container flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
        {copiesArray.map((_, index) => (
          <div
            key={index}
            className="label-thermal-item border-2 border-dashed border-zinc-400 bg-white text-black shadow-sm print:border-0 print:shadow-none"
            style={{
              width: `${labelWidthMm}mm`,
              height: `${labelHeightMm}mm`,
              padding: is40x60Landscape ? '0' : (labelFormat === '40x60' ? '2mm 2.2mm' : (labelFormat === '60x40' ? '1.8mm 2.8mm' : '1.8mm 2.2mm')),
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: is40x60Landscape ? 'center' : 'space-between',
              alignItems: is40x60Landscape ? 'center' : 'stretch',
              position: 'relative',
              overflow: 'hidden',
              pageBreakAfter: index < copiesArray.length - 1 ? 'always' : 'auto',
              breakAfter: index < copiesArray.length - 1 ? 'page' : 'auto',
            }}
          >
            {labelFormat === '40x60-landscape' ? (
              /* Layout Paisagem Rotacionada 90° (Design 60x40mm na bobina física de 40x60mm) */
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: '58mm',
                  height: '38mm',
                  transform: 'translate(-50%, -50%) rotate(90deg)',
                  transformOrigin: 'center center',
                  padding: '1.8mm 2.6mm',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  overflow: 'hidden',
                }}
              >
                {/* 1. Topo: Marca da Loja + Lote/Data */}
                <div className="flex items-center justify-between border-b border-black pb-[0.6mm] font-mono text-[6.5pt] font-bold uppercase leading-none">
                  <span>CYBER INFORMÁTICA</span>
                  <span>{item.shelf_location ? `${item.shelf_location} · ${monthYear}` : monthYear}</span>
                </div>

                {/* 2. Nome e Características do Produto */}
                <div className="my-[0.5mm] flex-1 flex flex-col justify-center overflow-hidden">
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
                    <div className="mt-[0.4mm] truncate font-mono text-[6.2pt] font-bold uppercase text-black leading-none">
                      {specsLine}
                    </div>
                  )}
                </div>

                {/* 3. Preço em Destaque */}
                {showPrice && (
                  <div className="my-[0.4mm] flex items-baseline justify-between border-y border-black py-[0.5mm] leading-none">
                    <span className="font-mono text-[5.8pt] font-bold uppercase">VALOR:</span>
                    <span className="font-mono text-[11.8pt] font-black tracking-tight text-black">
                      R$ {price}
                    </span>
                  </div>
                )}

                {/* 4. Código de Barras (Code 128) + SKU Interno */}
                <div className="pt-[0.3mm] text-center">
                  <div className="mx-auto w-full">
                    <Barcode128 value={activeBarcodeValue} height={showPrice ? 24 : 32} />
                  </div>
                  <div className="mt-[0.5mm] font-mono text-[6.2pt] font-bold tracking-wider uppercase leading-none text-black">
                    {codeSource === 'sku' ? `SKU: ${activeBarcodeValue}` : `EAN: ${activeBarcodeValue}`}
                  </div>
                </div>
              </div>
            ) : labelFormat === '40x60' ? (
              /* Layout Vertical Profissional 40x60mm (Preenchimento Completo da Altura) */
              <>
                {/* 1. Topo: Marca da Loja + Lote/Data */}
                <div className="flex items-center justify-between border-b-2 border-black pb-[0.8mm] font-mono text-[6.5pt] font-black uppercase leading-none">
                  <span>CYBER INFORMÁTICA</span>
                  <span>{item.shelf_location ? `${item.shelf_location} · ${monthYear}` : monthYear}</span>
                </div>

                {/* 2. Nome e Características do Produto */}
                <div className="my-[1.2mm] flex-1 flex flex-col justify-center">
                  <div
                    className="font-sans text-[9pt] font-black uppercase leading-[1.12] text-black"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {title}
                  </div>
                  {specsLine && (
                    <div className="mt-[1mm] font-mono text-[6.5pt] font-bold uppercase text-zinc-900 leading-tight">
                      {specsLine}
                    </div>
                  )}
                </div>

                {/* 3. Selo de Garantia da Loja */}
                <div className="mb-[1.2mm] border border-black bg-zinc-100 py-[0.8mm] text-center font-mono text-[6.2pt] font-black uppercase tracking-wider text-black leading-none">
                  ✦ GARANTIA DE 90 DIAS LOJA ✦
                </div>

                {/* 4. Preço em Destaque (Box Fechado) */}
                {showPrice && (
                  <div className="mb-[1.2mm] border-2 border-black p-[1mm] text-center bg-white">
                    <div className="font-mono text-[5.8pt] font-black uppercase tracking-wider text-black leading-none">
                      VALOR À VISTA / PIX
                    </div>
                    <div className="my-[0.6mm] font-mono text-[14pt] font-black tracking-tight leading-none text-black">
                      R$ {price}
                    </div>
                    <div className="font-mono text-[5.2pt] font-bold uppercase text-zinc-700 leading-none">
                      Consulte parcelamento no cartão
                    </div>
                  </div>
                )}

                {/* 5. Código de Barras (Code 128 com Altura Ideal de 42px) + SKU */}
                <div className="pt-[0.5mm] text-center">
                  <div className="mx-auto w-full flex justify-center">
                    <Barcode128
                      value={activeBarcodeValue}
                      height={showPrice ? 42 : 54}
                    />
                  </div>
                  <div className="mt-[0.8mm] font-mono text-[6.5pt] font-black tracking-widest uppercase leading-none text-black">
                    {codeSource === 'sku' ? `SKU: ${activeBarcodeValue}` : `EAN: ${activeBarcodeValue}`}
                  </div>
                </div>

                {/* 6. Rodapé da Loja */}
                <div className="mt-[1mm] border-t border-black pt-[0.6mm] text-center font-mono text-[5.5pt] font-bold uppercase text-black leading-none">
                  cyberinformatica.tech · Atendimento Loja
                </div>
              </>
            ) : (
              /* Layout Horizontal 60x40mm ou 50x40mm */
              <>
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
              </>
            )}
          </div>
        ))}
      </div>

      <style>{`
        @page {
          size: ${is40x60Any ? '40mm 60mm' : (labelFormat === '60x40' ? '60mm 40mm' : '50mm 40mm')};
          margin: 0 !important;
        }
        @media print {
          html, body {
            width: ${labelWidthMm}mm !important;
            height: ${paperHeightMm}mm !important;
            max-height: ${paperHeightMm}mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: hidden !important;
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
            overflow: hidden !important;
          }
          .label-print-container {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            width: ${labelWidthMm}mm !important;
            overflow: hidden !important;
          }
          .label-thermal-item {
            width: ${labelWidthMm}mm !important;
            height: ${labelHeightMm}mm !important;
            max-width: ${labelWidthMm}mm !important;
            max-height: ${labelHeightMm}mm !important;
            margin: 0 !important;
            padding: ${is40x60Landscape ? '0' : (labelFormat === '40x60' ? '2mm 2.2mm' : (labelFormat === '60x40' ? '1.8mm 2.8mm' : '1.8mm 2.2mm'))} !important;
            border: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            position: relative !important;
            overflow: hidden !important;
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