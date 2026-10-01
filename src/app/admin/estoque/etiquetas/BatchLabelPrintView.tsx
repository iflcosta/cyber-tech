'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Barcode } from '@/components/Barcode';
import { Printer, ArrowLeft, CheckSquare, Square, Search, Filter } from 'lucide-react';

interface BatchStockItem {
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

export function BatchLabelPrintView({ items }: { items: BatchStockItem[] }) {
  const [selectedMap, setSelectedMap] = useState<Record<string, number>>(() => {
    // Começa com os primeiros 10 itens com estoque selecionados (1 cópia cada)
    const initial: Record<string, number> = {};
    items.filter((i) => i.current_stock > 0).slice(0, 10).forEach((i) => {
      initial[i.id] = 1;
    });
    return initial;
  });

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [labelSize, setLabelSize] = useState<'58mm' | '50x30' | '80mm'>('58mm');

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))) as string[];

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.internal_sku && item.internal_sku.toLowerCase().includes(q)) ||
      (item.ean13 && item.ean13.toLowerCase().includes(q)) ||
      (item.shelf_location && item.shelf_location.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const toggleSelect = (id: string, defaultCopies = 1) => {
    setSelectedMap((prev) => {
      const copy = { ...prev };
      if (copy[id]) {
        delete copy[id];
      } else {
        copy[id] = defaultCopies;
      }
      return copy;
    });
  };

  const setItemCopies = (id: string, count: number) => {
    setSelectedMap((prev) => {
      const copy = { ...prev };
      if (count <= 0) {
        delete copy[id];
      } else {
        copy[id] = Math.min(100, count);
      }
      return copy;
    });
  };

  const selectAllFiltered = () => {
    setSelectedMap((prev) => {
      const next = { ...prev };
      filteredItems.forEach((i) => {
        next[i.id] = next[i.id] || 1;
      });
      return next;
    });
  };

  const deselectAll = () => {
    setSelectedMap({});
  };

  // Prepara lista plana de etiquetas a serem impressas
  const queueToPrint: Array<{ item: BatchStockItem; copyIndex: number }> = [];
  items.forEach((item) => {
    const count = selectedMap[item.id] || 0;
    for (let c = 0; c < count; c++) {
      queueToPrint.push({ item, copyIndex: c });
    }
  });

  return (
    <>
      {/* ============ CONTROLES NA TELA (OCULTOS NA IMPRESSÃO) ============ */}
      <div className="print:hidden mx-auto mb-8 max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-950 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
                Fila de Impressão
              </span>
              <h1 className="text-xl font-black uppercase tracking-tight text-zinc-950">
                Impressão em Lote · Etiquetas Térmicas de Produtos
              </h1>
            </div>
            <p className="mt-1 font-mono text-xs text-zinc-600">
              Selecione os produtos e a quantidade de cada um. Ideal para rotulagem de gôndola, estante de 6m e chegada de estoque.
            </p>
          </div>
          <Link
            href="/admin/estoque"
            className="flex items-center gap-1.5 border-2 border-zinc-950 bg-white px-3.5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Estoque</span>
          </Link>
        </div>

        {/* Barra de Filtros e Busca */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nome, SKU interno, EAN-13 ou prateleira..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border-2 border-zinc-950 bg-white py-2 pl-9 pr-3 font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-600 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border-2 border-zinc-950 bg-white py-2 px-2 font-mono text-xs font-bold"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Painel de Ações em Massa */}
        <div className="flex flex-wrap items-center justify-between gap-3 border border-zinc-300 bg-zinc-50 p-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={selectAllFiltered}
              className="border border-zinc-950 bg-white px-2.5 py-1 font-bold text-zinc-950 hover:bg-zinc-100"
            >
              ✓ Marcar Filtrados ({filteredItems.length})
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="border border-zinc-300 bg-white px-2.5 py-1 text-zinc-600 hover:bg-zinc-100"
            >
              ✕ Desmarcar Todos
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 font-bold text-zinc-700">
              Formato:
              <select
                value={labelSize}
                onChange={(e) => setLabelSize(e.target.value as typeof labelSize)}
                className="border border-zinc-950 bg-white px-1.5 py-0.5 text-xs font-bold"
              >
                <option value="58mm">58mm (Bobina MPT-II)</option>
                <option value="50x30">50x30mm (Adesiva)</option>
                <option value="80mm">80mm (Larga)</option>
              </select>
            </label>

            <button
              type="button"
              disabled={queueToPrint.length === 0}
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 disabled:opacity-40 transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Lote ({queueToPrint.length} Etiquetas)</span>
            </button>
          </div>
        </div>

        {/* Tabela de Seleção */}
        <div className="max-h-96 overflow-y-auto border-2 border-zinc-950 bg-white">
          <table className="w-full text-left font-mono text-xs">
            <thead className="sticky top-0 border-b-2 border-zinc-950 bg-zinc-100 uppercase text-zinc-700">
              <tr>
                <th className="w-12 px-3 py-2 text-center">Sel.</th>
                <th className="px-3 py-2">Item / SKU</th>
                <th className="px-3 py-2">Local / Categoria</th>
                <th className="px-3 py-2 text-right">Preço</th>
                <th className="w-32 px-3 py-2 text-center">Qtd. Etiquetas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredItems.map((item) => {
                const isSelected = Boolean(selectedMap[item.id]);
                const count = selectedMap[item.id] || 0;
                return (
                  <tr
                    key={item.id}
                    className={`transition hover:bg-zinc-50 ${isSelected ? 'bg-amber-50/50' : ''}`}
                  >
                    <td className="px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleSelect(item.id, Math.max(1, item.current_stock || 1))}
                        className="text-zinc-950"
                      >
                        {isSelected ? (
                          <CheckSquare className="h-4 w-4 text-emerald-600 inline" />
                        ) : (
                          <Square className="h-4 w-4 text-zinc-400 inline" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-zinc-950">{item.name}</div>
                      <div className="text-[10px] text-zinc-500">
                        {item.internal_sku && <span className="font-bold mr-2">{item.internal_sku}</span>}
                        {item.ean13 && <span>EAN: {item.ean13}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-zinc-600">
                      <div>{item.category || 'Geral'}</div>
                      {item.shelf_location && (
                        <span className="border border-zinc-300 bg-zinc-100 px-1 text-[9px] font-bold text-zinc-700">
                          {item.shelf_location}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-zinc-950">
                      {item.unit_price.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {isSelected ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setItemCopies(item.id, count - 1)}
                            className="h-6 w-6 border border-zinc-950 bg-zinc-100 font-bold hover:bg-zinc-200"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={count}
                            onChange={(e) => setItemCopies(item.id, parseInt(e.target.value) || 1)}
                            className="h-6 w-12 border border-zinc-950 text-center font-bold text-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setItemCopies(item.id, count + 1)}
                            className="h-6 w-6 border border-zinc-950 bg-zinc-100 font-bold hover:bg-zinc-200"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => toggleSelect(item.id, 1)}
                          className="border border-zinc-300 px-2 py-1 text-[10px] text-zinc-500 hover:border-zinc-950 hover:text-zinc-950"
                        >
                          + Adicionar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pré-visualização da Fila */}
        <div className="rounded border-2 border-zinc-950 bg-white p-4">
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
            <span className="font-mono text-xs font-bold uppercase text-zinc-950">
              Pré-visualização do Rolo ({queueToPrint.length} Etiquetas)
            </span>
            <span className="font-mono text-xs text-zinc-500">
              Rolo Térmico {labelSize}
            </span>
          </div>
          <p className="mt-2 font-mono text-xs text-zinc-600">
            Abaixo estão as etiquetas prontas para saída na impressora térmica. Ao clicar em &quot;Imprimir Lote&quot;, o navegador disparará todas em sequência contínua.
          </p>
        </div>
      </div>

      {/* ============ DISPARO DAS ETIQUETAS NO ROLO ============ */}
      <div className="flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
        {queueToPrint.map(({ item, copyIndex }, idx) => {
          const barcodeValue = item.ean13 || item.internal_sku || item.id.slice(0, 8).toUpperCase();
          const formattedPrice = item.unit_price.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          });

          return (
            <div
              key={`${item.id}-${copyIndex}-${idx}`}
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
              {/* Header Loja */}
              <div className="text-center border-b border-black pb-0.5 mb-1">
                <span className="text-[10px] font-black tracking-widest uppercase">
                  CYBER INFORMÁTICA
                </span>
              </div>

              {/* Nome */}
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

              {/* Código de barras */}
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

              {/* Preço */}
              <div className="text-center py-1 bg-black text-white my-1">
                <span className="text-sm font-black tracking-tight">
                  {formattedPrice}
                </span>
                <span className="block text-[8px] font-bold uppercase tracking-wider text-zinc-300">
                  À Vista ou Cartão
                </span>
              </div>

              {/* Localização e Garantia */}
              <div className="pt-0.5 flex items-center justify-between text-[8px] font-bold uppercase border-t border-black text-zinc-800">
                <span className="truncate max-w-[60%]">
                  {item.shelf_location || 'BALCÃO'}
                </span>
                <span>GARANTIA 90D</span>
              </div>
            </div>
          );
        })}
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
