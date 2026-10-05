'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Barcode128, ensureValidEAN13 } from '@/app/admin/components/Barcode128';
import {
  parseDeviceNotes,
  isDeviceItem,
  calculateInstallment,
  DeviceType,
} from '@/app/admin/lib/deviceSpecs';

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
  const compactSku = item.internal_sku || `CY${item.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;
  const ean13Code = ensureValidEAN13(item.ean13 || item.id);
  const numericSku = (
    parseInt(item.id.replace(/-/g, '').slice(0, 6), 16) % 900000 +
    100000
  ).toString();

  // Detecção automática de Aparelho / Máquina
  const parsedNotes = parseDeviceNotes(item.notes);
  const isInitiallyDevice = isDeviceItem(item.category, item.notes);

  const [labelMode, setLabelMode] = useState<'device-tech' | 'standard' | 'showcase'>(
    isInitiallyDevice ? 'device-tech' : 'standard',
  );

  const [labelFormat, setLabelFormat] = useState<'40x60' | '40x60-landscape' | '60x40' | '50x40'>('40x60');
  const [title, setTitle] = useState(item.name);
  const [specsLine, setSpecsLine] = useState(defaultSpecs || 'Pronta-Entrega · Garantia Loja');
  const [price, setPrice] = useState(
    item.unit_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  );
  const [codeFormat, setCodeFormat] = useState<'ean13' | 'compact' | 'numeric' | 'code39' | 'full' | 'custom'>('compact');
  const [customCode, setCustomCode] = useState('');
  const [barcodeHeight, setBarcodeHeight] = useState<number>(36);
  const [barWidth, setBarWidth] = useState<number>(2);
  const [showWarranty, setShowWarranty] = useState<boolean>(true);
  const [copies, setCopies] = useState(1);
  const [showPrice, setShowPrice] = useState(true);

  // Campos específicos de Ficha Técnica da Máquina
  const [deviceCondition, setDeviceCondition] = useState(
    parsedNotes.specs?.condition || (item.category?.includes('PC') ? 'NOVO (MONTAGEM)' : 'SEMINOVO GRADE A+'),
  );
  const [deviceCpu, setDeviceCpu] = useState(parsedNotes.specs?.cpu || '');
  const [deviceRam, setDeviceRam] = useState(parsedNotes.specs?.ram || '');
  const [deviceStorage, setDeviceStorage] = useState(parsedNotes.specs?.storage || '');
  const [deviceGpu, setDeviceGpu] = useState(parsedNotes.specs?.gpu || '');
  const [deviceScreen, setDeviceScreen] = useState(parsedNotes.specs?.screen || '');
  const [deviceBattery, setDeviceBattery] = useState(
    parsedNotes.specs?.battery || (parsedNotes.specs?.batteryHealth ? `Saúde: ${parsedNotes.specs.batteryHealth}` : ''),
  );
  const [deviceImei, setDeviceImei] = useState(
    parsedNotes.specs?.imei || parsedNotes.specs?.serialNumber || '',
  );
  const [deviceCardInstallment, setDeviceCardInstallment] = useState(
    parsedNotes.specs?.installmentInfo || calculateInstallment(item.unit_price).text,
  );
  const [deviceWarrantyText, setDeviceWarrantyText] = useState(
    parsedNotes.specs?.warranty || '✦ 90 Dias de Garantia Loja',
  );

  let activeBarcodeValue = compactSku;
  let activeFormat: 'EAN13' | 'CODE128' | 'CODE39' = 'CODE128';

  if (codeFormat === 'ean13') {
    activeBarcodeValue = ean13Code;
    activeFormat = 'EAN13';
  } else if (codeFormat === 'compact') {
    activeBarcodeValue = compactSku;
    activeFormat = 'CODE128';
  } else if (codeFormat === 'numeric') {
    activeBarcodeValue = numericSku;
    activeFormat = 'CODE128';
  } else if (codeFormat === 'code39') {
    activeBarcodeValue = compactSku;
    activeFormat = 'CODE39';
  } else if (codeFormat === 'full') {
    activeBarcodeValue = fallbackSku;
    activeFormat = 'CODE128';
  } else if (codeFormat === 'custom') {
    activeBarcodeValue = customCode.trim() || compactSku;
    activeFormat = /^\d{12,13}$/.test(activeBarcodeValue) ? 'EAN13' : 'CODE128';
  }

  const copiesArray = Array.from({ length: Math.max(1, Math.min(50, copies)) });

  const is40x60Landscape = labelFormat === '40x60-landscape';
  const is40x60Any = labelFormat === '40x60' || is40x60Landscape;

  const labelWidthMm = labelFormat === '60x40' ? 60 : (is40x60Any ? 40 : 50);
  const labelHeightMm = is40x60Any ? 60 : (labelFormat === '60x40' ? 40 : 40);

  return (
    <>
      {/* Painel de Configuração (Oculto na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-3xl border-2 border-zinc-950 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              Knup KP-IM608 · {is40x60Landscape ? '40x60 Paisagem (De Lado)' : `${labelFormat}mm`}
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
              Gerador de Etiquetas Cyber
            </span>
          </div>
          <Link
            href={`/admin/estoque/${item.id}`}
            className="font-mono text-xs font-bold text-zinc-950 underline underline-offset-4"
          >
            ← Voltar para o Item
          </Link>
        </div>

        {/* 1. SELETOR PRINCIPAL DO TIPO DE ETIQUETA */}
        <div className="mt-4">
          <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700 mb-1.5">
            Modelo / Tipo de Etiqueta:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setLabelMode('device-tech')}
              className={`p-2.5 font-mono text-xs font-bold uppercase border-2 text-left transition cursor-pointer ${
                labelMode === 'device-tech'
                  ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                  : 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              💻📱 Ficha Técnica de Aparelho
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                Especificações (CPU, RAM, SSD) + Preço + Barcode
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLabelMode('standard')}
              className={`p-2.5 font-mono text-xs font-bold uppercase border-2 text-left transition cursor-pointer ${
                labelMode === 'standard'
                  ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                  : 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              🏷️ Etiqueta de Produto Padrão
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                Código de barras grande + Preço PDV
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLabelMode('showcase')}
              className={`p-2.5 font-mono text-xs font-bold uppercase border-2 text-left transition cursor-pointer ${
                labelMode === 'showcase'
                  ? 'border-zinc-950 bg-zinc-950 text-white shadow-xs'
                  : 'border-zinc-300 bg-zinc-50 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              🪧 Display de Vitrine / Balcão
              <span className="block text-[10px] font-normal opacity-80 mt-0.5">
                Expositor de acrílico para balcão da loja
              </span>
            </button>
          </div>
        </div>

        {/* 2. SELETOR DE TAMANHO / BOBINA (PARA ETIQUETAS TÉRMICAS) */}
        {labelMode !== 'showcase' && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3">
            <span className="font-mono text-[11px] font-bold uppercase text-zinc-700 mr-1">
              Formato / Bobina:
            </span>
            <button
              type="button"
              onClick={() => setLabelFormat('40x60')}
              className={`px-3 py-1 font-mono text-xs font-bold uppercase border cursor-pointer ${
                labelFormat === '40x60'
                  ? 'border-zinc-950 bg-zinc-950 text-white'
                  : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              📱 40x60 mm Vertical (Em Pé)
            </button>
            <button
              type="button"
              onClick={() => setLabelFormat('40x60-landscape')}
              className={`px-3 py-1 font-mono text-xs font-bold uppercase border cursor-pointer ${
                labelFormat === '40x60-landscape'
                  ? 'border-zinc-950 bg-zinc-950 text-white'
                  : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              🔄 40x60 mm De Lado (Paisagem 60x40 na bobina 40mm)
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
          </div>
        )}

        {/* 3. CAMPOS DE EDIÇÃO EM TEMPO REAL */}
        <div className="mt-4 border-t border-zinc-200 pt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">
                Título / Nome da Máquina
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full border border-zinc-400 px-2.5 py-1.5 font-mono text-xs text-zinc-950 font-bold"
              />
            </label>

            <label className="block">
              <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">
                Valor à Vista / Pix (R$)
              </span>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="mt-1 w-full border border-zinc-400 px-2.5 py-1.5 font-mono text-xs font-bold text-emerald-800"
              />
            </label>
          </div>

          {/* Especificações da Máquina (Modos Ficha Técnica e Vitrine) */}
          {(labelMode === 'device-tech' || labelMode === 'showcase') && (
            <div className="border border-zinc-300 bg-zinc-50 p-3 space-y-3">
              <div className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 flex items-center justify-between">
                <span>Especificações Técnicas na Etiqueta</span>
                <span className="text-[10px] text-zinc-500 font-normal">Ajuste fino pré-impressão</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <label className="block">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-600 block">Selo de Condição</span>
                  <input
                    value={deviceCondition}
                    onChange={(e) => setDeviceCondition(e.target.value.toUpperCase())}
                    className="w-full border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
                    placeholder="SEMINOVO GRADE A+"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-600 block">Processador (CPU)</span>
                  <input
                    value={deviceCpu}
                    onChange={(e) => setDeviceCpu(e.target.value)}
                    className="w-full border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
                    placeholder="i5-8250U 3.4GHz"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-600 block">Memória RAM</span>
                  <input
                    value={deviceRam}
                    onChange={(e) => setDeviceRam(e.target.value)}
                    className="w-full border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
                    placeholder="16GB DDR4"
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <label className="block">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-600 block">SSD / Armazenamento</span>
                  <input
                    value={deviceStorage}
                    onChange={(e) => setDeviceStorage(e.target.value)}
                    className="w-full border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
                    placeholder="512GB SSD NVMe"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-600 block">Vídeo / Gráficos</span>
                  <input
                    value={deviceGpu}
                    onChange={(e) => setDeviceGpu(e.target.value)}
                    className="w-full border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
                    placeholder="Intel UHD 620 / RTX 4060"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-600 block">Tela / Bateria</span>
                  <input
                    value={deviceScreen || deviceBattery}
                    onChange={(e) => {
                      if (deviceScreen) setDeviceScreen(e.target.value);
                      else setDeviceBattery(e.target.value);
                    }}
                    className="w-full border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
                    placeholder='14" Full HD / Saúde 92%'
                  />
                </label>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <label className="block">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-600 block">Parcelamento Cartão</span>
                  <input
                    value={deviceCardInstallment}
                    onChange={(e) => setDeviceCardInstallment(e.target.value)}
                    className="w-full border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
                    placeholder="12x de R$ 209,00"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-600 block">Texto de Garantia</span>
                  <input
                    value={deviceWarrantyText}
                    onChange={(e) => setDeviceWarrantyText(e.target.value)}
                    className="w-full border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
                    placeholder="✦ 90 Dias de Garantia Loja"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-mono font-bold uppercase text-zinc-600 block">Serial / IMEI</span>
                  <input
                    value={deviceImei}
                    onChange={(e) => setDeviceImei(e.target.value)}
                    className="w-full border border-zinc-300 bg-white px-2 py-1 font-mono text-xs"
                    placeholder="Opcional"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Configuração de Código de Barras e Cópias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-zinc-200 pt-3">
            <div>
              <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">
                Padrão do Código de Barras
              </span>
              <select
                value={codeFormat}
                onChange={(e) => setCodeFormat(e.target.value as any)}
                className="mt-1 w-full border-2 border-zinc-950 bg-white px-2 py-1 font-mono text-xs text-zinc-950 font-bold"
              >
                <option value="compact">⚡ Code 128 Compacto ({compactSku}) — Recomendado</option>
                <option value="ean13">🏷️ EAN-13 Supermercado ({ean13Code})</option>
                <option value="numeric">🔢 Code 128 Numérico ({numericSku})</option>
                <option value="code39">📋 Code 39 ({compactSku})</option>
                <option value="full">🏷️ Code 128 Completo ({fallbackSku})</option>
                <option value="custom">✏️ Personalizado (Digitar Código)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2">
              <span className="font-mono text-[11px] font-bold uppercase text-zinc-700">
                Qtd. Cópias:
              </span>
              <input
                type="number"
                min={1}
                max={50}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 border border-zinc-400 px-2 py-1 font-mono text-xs font-bold text-center text-zinc-950"
              />
            </div>
          </div>
        </div>

        {/* Botão de Impressão */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 pt-4">
          <p className="font-mono text-[11px] text-zinc-600">
            {labelMode === 'showcase'
              ? 'Pronto para Display de Acrílico de Balcão / Vitrine.'
              : `Impressão Térmica: ${is40x60Landscape ? '40 x 60 mm De Lado (Paisagem)' : `${labelWidthMm} x ${labelHeightMm} mm`}.`}
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-zinc-950 px-5 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition cursor-pointer shadow-md"
          >
            🖨️ Imprimir {copies > 1 ? `${copies} Etiquetas` : 'Etiqueta'}
          </button>
        </div>
      </div>

      {/* Dica visual informativa sobre o Modo Paisagem */}
      {is40x60Landscape && labelMode !== 'showcase' && (
        <div className="print:hidden mx-auto mb-4 max-w-2xl border-2 border-zinc-950 bg-zinc-100 px-3 py-2 text-center font-mono text-[11px] font-bold uppercase text-zinc-950">
          🔄 <strong>Modo Paisagem Ativo:</strong> A etiqueta sai <strong>girada 90° de lado</strong> na bobina de 40mm. Ao colar no produto, você cola na <strong>horizontal (60mm de largura × 40mm de altura)</strong>!
        </div>
      )}

      {/* ÁREA DE IMPRESSÃO */}
      {labelMode === 'showcase' ? (
        /* MODELO DISPLAY DE VITRINE / PRATELEIRA */
        <div className="mx-auto my-4 max-w-[420px] print:m-0 print:max-w-none">
          <div className="border-4 border-zinc-950 bg-white p-6 shadow-2xl font-sans text-zinc-950 print:border-2 print:shadow-none">
            <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="bg-zinc-950 text-white px-2 py-0.5 font-black text-xs uppercase tracking-wider">CYBER</span>
                <span className="font-extrabold text-xs tracking-tight uppercase">INFORMÁTICA</span>
              </div>
              <span className="border border-emerald-600 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
                {deviceCondition}
              </span>
            </div>

            <div className="mt-3">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 tracking-wider block">
                {item.category?.toUpperCase() || 'EQUIPAMENTO PRONTA-ENTREGA'}
              </span>
              <h2 className="text-lg font-black uppercase tracking-tight text-zinc-950 leading-tight mt-0.5">
                {title}
              </h2>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 font-mono text-xs">
              {deviceCpu && (
                <div className="border border-zinc-300 bg-zinc-50 p-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">⚡ Processador</div>
                  <div className="font-black text-zinc-950 text-[11px] mt-0.5">{deviceCpu}</div>
                </div>
              )}
              {deviceRam && (
                <div className="border border-zinc-300 bg-zinc-50 p-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">🧠 Memória RAM</div>
                  <div className="font-black text-zinc-950 text-[11px] mt-0.5">{deviceRam}</div>
                </div>
              )}
              {deviceStorage && (
                <div className="border border-zinc-300 bg-zinc-50 p-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">💾 Armazenamento</div>
                  <div className="font-black text-zinc-950 text-[11px] mt-0.5">{deviceStorage}</div>
                </div>
              )}
              {deviceGpu && (
                <div className="border border-zinc-300 bg-zinc-50 p-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">🎮 Gráficos</div>
                  <div className="font-black text-zinc-950 text-[11px] mt-0.5">{deviceGpu}</div>
                </div>
              )}
              {deviceScreen && (
                <div className="border border-zinc-300 bg-zinc-50 p-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">🖥️ Tela</div>
                  <div className="font-black text-zinc-950 text-[11px] mt-0.5">{deviceScreen}</div>
                </div>
              )}
              {deviceBattery && (
                <div className="border border-zinc-300 bg-zinc-50 p-2">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">🔋 Bateria</div>
                  <div className="font-black text-zinc-950 text-[11px] mt-0.5">{deviceBattery}</div>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between text-[10px] font-mono font-bold bg-zinc-100 p-2 border border-zinc-300">
              <span>🛡️ {deviceWarrantyText}</span>
              {deviceImei && <span>SN: {deviceImei}</span>}
            </div>

            <div className="mt-4 border-2 border-zinc-950 bg-zinc-950 text-white p-3 text-center">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                À VISTA NO PIX OU DINHEIRO
              </span>
              <div className="text-3xl font-black font-mono tracking-tight text-white my-0.5">
                R$ {price}
              </div>
              <div className="font-mono text-xs text-zinc-300">
                ou {deviceCardInstallment}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-zinc-200 flex items-center justify-between font-mono text-[9px] text-zinc-500">
              <span>SKU: <strong className="text-zinc-900">{compactSku}</strong></span>
              <span>cyberinformatica.tech</span>
            </div>
          </div>
        </div>
      ) : (
        /* MODELO TÉRMICO (60x40mm, 40x60mm De Lado, ou 40x60mm Vertical) */
        <div className="label-print-container flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
          {copiesArray.map((_, index) => (
            <div
              key={index}
              className="label-thermal-item border-2 border-dashed border-zinc-400 bg-white text-black shadow-sm print:border-0 print:shadow-none"
              style={{
                width: labelFormat === '40x60' ? '38mm' : `${labelWidthMm}mm`,
                height: `${labelHeightMm}mm`,
                padding: is40x60Landscape ? '0' : (labelFormat === '40x60' ? '2mm 1.5mm' : (labelFormat === '60x40' ? '1.8mm 2.5mm' : '2mm 2.5mm')),
                margin: labelFormat === '40x60' ? '0 1mm' : '0 auto',
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
              {labelMode === 'device-tech' ? (
                /* FICHA TÉCNICA DA MÁQUINA NA ETIQUETA TÉRMICA */
                labelFormat === '40x60-landscape' ? (
                  /* Formato 60x40mm Rotacionado 90° (para bobina 40mm) */
                  <div
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: '58mm',
                      height: '38mm',
                      transform: 'translate(-50%, -50%) rotate(90deg)',
                      transformOrigin: 'center center',
                      padding: '1.4mm 2mm',
                      boxSizing: 'border-box',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Topo */}
                    <div className="flex items-center justify-between border-b border-black pb-[0.3mm] font-mono text-[5.8pt] font-black uppercase leading-none">
                      <span>CYBER INFORMÁTICA</span>
                      <span className="bg-black text-white px-1 py-0.2">{deviceCondition}</span>
                    </div>

                    {/* Título */}
                    <div className="my-[0.3mm]">
                      <div className="font-sans text-[7.5pt] font-black uppercase leading-tight truncate text-black">
                        {title}
                      </div>
                    </div>

                    {/* Ficha Técnica */}
                    <div className="border border-black bg-zinc-50 p-[0.8mm] font-mono text-[5.2pt] leading-tight space-y-[0.3mm]">
                      {deviceCpu && (
                        <div className="flex justify-between">
                          <span className="font-bold text-zinc-600">CPU:</span>
                          <span className="font-black text-black truncate max-w-[42mm]">{deviceCpu}</span>
                        </div>
                      )}
                      {(deviceRam || deviceStorage) && (
                        <div className="flex justify-between">
                          <span className="font-bold text-zinc-600">RAM/SSD:</span>
                          <span className="font-black text-black">{deviceRam} · {deviceStorage}</span>
                        </div>
                      )}
                      {(deviceGpu || deviceScreen || deviceBattery) && (
                        <div className="flex justify-between">
                          <span className="font-bold text-zinc-600">OBS:</span>
                          <span className="font-black text-black truncate max-w-[42mm]">
                            {[deviceGpu, deviceScreen, deviceBattery].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Bloco de Preço */}
                    <div className="my-[0.3mm] flex items-stretch border border-black bg-white">
                      <div className="bg-black text-white px-1.5 py-[0.5mm] flex flex-col justify-center items-center text-center">
                        <span className="text-[4.5pt] font-bold uppercase leading-none">À VISTA</span>
                        <span className="text-[9pt] font-black tracking-tight leading-none mt-0.5">R$ {price}</span>
                      </div>
                      <div className="flex-1 pl-1.5 py-[0.5mm] flex flex-col justify-center font-mono text-[4.8pt] leading-none">
                        <span className="font-bold text-black">{deviceCardInstallment}</span>
                        <span className="text-[4.2pt] text-zinc-600 mt-0.5">{deviceWarrantyText}</span>
                      </div>
                    </div>

                    {/* Barcode Bipável no PDV */}
                    <div className="text-center pt-[0.2mm]">
                      <div className="mx-auto w-full flex justify-center">
                        <Barcode128
                          value={activeBarcodeValue}
                          format={activeFormat}
                          height={18}
                          barWidth={barWidth}
                        />
                      </div>
                      <div className="font-mono text-[5.5pt] font-black tracking-wider uppercase leading-none mt-[0.3mm]">
                        SKU: {compactSku}
                      </div>
                    </div>
                  </div>
                ) : labelFormat === '40x60' ? (
                  /* Formato 40x60mm Vertical */
                  <>
                    <div className="flex items-center justify-between border-b border-black pb-[0.4mm] font-mono text-[6pt] font-black uppercase leading-none">
                      <span>CYBER INFORMÁTICA</span>
                      <span className="text-[5pt] font-bold">{monthYear}</span>
                    </div>

                    <div className="my-[0.5mm] text-center">
                      <div className="font-sans text-[7.8pt] font-black uppercase leading-tight text-black line-clamp-2">
                        {title}
                      </div>
                      <span className="inline-block mt-[0.3mm] bg-black text-white font-mono text-[5pt] font-bold px-1 py-0.2 uppercase">
                        {deviceCondition}
                      </span>
                    </div>

                    <div className="border-y border-black py-[0.6mm] my-[0.3mm] font-mono text-[5.6pt] leading-snug space-y-[0.2mm]">
                      {deviceCpu && <div>⚡ <strong>{deviceCpu}</strong></div>}
                      {deviceRam && <div>🧠 <strong>{deviceRam}</strong></div>}
                      {deviceStorage && <div>💾 <strong>{deviceStorage}</strong></div>}
                      {deviceGpu && <div>🎮 <strong>{deviceGpu}</strong></div>}
                      {deviceScreen && <div>🖥️ <strong>{deviceScreen}</strong></div>}
                      {deviceBattery && <div>🔋 <strong>{deviceBattery}</strong></div>}
                      {deviceImei && <div>🏷️ <strong>SN: {deviceImei}</strong></div>}
                    </div>

                    <div className="border border-black p-[0.6mm] text-center bg-zinc-50 my-[0.4mm]">
                      <span className="font-mono text-[5pt] font-black uppercase leading-none block">
                        VALOR À VISTA / PIX
                      </span>
                      <span className="font-mono text-[11pt] font-black tracking-tight leading-none text-black my-[0.3mm] block">
                        R$ {price}
                      </span>
                      <span className="font-mono text-[5pt] font-bold text-zinc-700 leading-none block">
                        {deviceCardInstallment}
                      </span>
                    </div>

                    <div className="pt-[0.2mm] text-center">
                      <div className="mx-auto w-full flex justify-center">
                        <Barcode128
                          value={activeBarcodeValue}
                          format={activeFormat}
                          height={22}
                          barWidth={barWidth}
                        />
                      </div>
                      <div className="mt-[0.4mm] font-mono text-[5.8pt] font-black tracking-wider uppercase leading-none text-black">
                        SKU: {compactSku}
                      </div>
                    </div>
                  </>
                ) : (
                  /* Formato 60x40mm Horizontal Padrão */
                  <>
                    <div className="flex items-center justify-between border-b border-black pb-[0.5mm] font-mono text-[6.5pt] font-black uppercase leading-none">
                      <span>CYBER INFORMÁTICA</span>
                      <span className="bg-black text-white px-1.5 py-0.2">{deviceCondition}</span>
                    </div>

                    <div className="my-[0.4mm]">
                      <div className="font-sans text-[8.2pt] font-black uppercase leading-tight truncate text-black">
                        {title}
                      </div>
                    </div>

                    <div className="border border-black bg-zinc-50 p-[1mm] font-mono text-[5.8pt] leading-tight space-y-[0.3mm]">
                      {deviceCpu && (
                        <div className="flex justify-between">
                          <span className="font-bold text-zinc-600">CPU:</span>
                          <span className="font-black text-black truncate max-w-[44mm]">{deviceCpu}</span>
                        </div>
                      )}
                      {(deviceRam || deviceStorage) && (
                        <div className="flex justify-between">
                          <span className="font-bold text-zinc-600">RAM / SSD:</span>
                          <span className="font-black text-black">{deviceRam} · {deviceStorage}</span>
                        </div>
                      )}
                      {(deviceGpu || deviceScreen || deviceBattery) && (
                        <div className="flex justify-between">
                          <span className="font-bold text-zinc-600">DETALHES:</span>
                          <span className="font-black text-black truncate max-w-[44mm]">
                            {[deviceGpu, deviceScreen, deviceBattery].filter(Boolean).join(' · ')}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="my-[0.4mm] flex items-stretch border border-black bg-white">
                      <div className="bg-black text-white px-2 py-[0.6mm] flex flex-col justify-center items-center text-center">
                        <span className="text-[5pt] font-bold uppercase leading-none">À VISTA</span>
                        <span className="text-[10.5pt] font-black tracking-tight leading-none mt-0.5">R$ {price}</span>
                      </div>
                      <div className="flex-1 pl-2 py-[0.6mm] flex flex-col justify-center font-mono text-[5.2pt] leading-none">
                        <span className="font-bold text-black">{deviceCardInstallment}</span>
                        <span className="text-[4.5pt] text-zinc-600 mt-0.5">{deviceWarrantyText}</span>
                      </div>
                    </div>

                    <div className="text-center pt-[0.2mm]">
                      <div className="mx-auto w-full flex justify-center">
                        <Barcode128
                          value={activeBarcodeValue}
                          format={activeFormat}
                          height={20}
                          barWidth={barWidth}
                        />
                      </div>
                      <div className="font-mono text-[6pt] font-black tracking-wider uppercase leading-none mt-[0.3mm]">
                        SKU: {compactSku}
                      </div>
                    </div>
                  </>
                )
              ) : (
                /* MODO PADRÃO DE PRODUTO / PEÇA (EXISTENTE) */
                labelFormat === '40x60-landscape' ? (
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
                    <div className="flex items-center justify-between border-b border-black pb-[0.6mm] font-mono text-[6.5pt] font-bold uppercase leading-none">
                      <span>CYBER INFORMÁTICA</span>
                      <span>{item.shelf_location ? `${item.shelf_location} · ${monthYear}` : monthYear}</span>
                    </div>

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

                    {showPrice && (
                      <div className="my-[0.4mm] flex items-baseline justify-between border-y border-black py-[0.5mm] leading-none">
                        <span className="font-mono text-[5.8pt] font-bold uppercase">VALOR:</span>
                        <span className="font-mono text-[11.8pt] font-black tracking-tight text-black">
                          R$ {price}
                        </span>
                      </div>
                    )}

                    <div className="pt-[0.3mm] text-center">
                      <div className="mx-auto w-full flex justify-center">
                        <Barcode128
                          value={activeBarcodeValue}
                          format={activeFormat}
                          height={Math.min(barcodeHeight, 38)}
                          barWidth={barWidth}
                        />
                      </div>
                      <div className="mt-[0.5mm] font-mono text-[6.5pt] font-black tracking-wider uppercase leading-none text-black">
                        {activeFormat === 'EAN13' ? `EAN: ${activeBarcodeValue}` : `CÓD: ${activeBarcodeValue}`}
                      </div>
                    </div>
                  </div>
                ) : labelFormat === '40x60' ? (
                  <>
                    <div className="flex items-center justify-between border-b border-black pb-[0.4mm] font-mono text-[6.2pt] font-black uppercase leading-none">
                      <span>CYBER INFORMÁTICA</span>
                      <span>{item.shelf_location ? `${item.shelf_location} · ${monthYear}` : monthYear}</span>
                    </div>

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
                        <div className="mt-[0.4mm] truncate font-mono text-[5.8pt] font-bold uppercase text-zinc-800 leading-tight">
                          {specsLine}
                        </div>
                      )}
                    </div>

                    {showWarranty && (
                      <div className="mb-[0.5mm] border border-black bg-zinc-100 py-[0.4mm] text-center font-mono text-[5.6pt] font-black uppercase tracking-wider text-black leading-none whitespace-nowrap">
                        ✦ GARANTIA DE 90 DIAS ✦
                      </div>
                    )}

                    {showPrice && (
                      <div className="mb-[0.5mm] border-2 border-black p-[0.5mm] text-center bg-white">
                        <div className="font-mono text-[5.2pt] font-black uppercase tracking-wider text-black leading-none">
                          VALOR À VISTA / PIX
                        </div>
                        <div className="my-[0.3mm] font-mono text-[12.5pt] font-black tracking-tight leading-none text-black">
                          R$ {price}
                        </div>
                        <div className="font-mono text-[4.8pt] font-bold uppercase text-zinc-600 leading-none">
                          Consulte parcelamento no cartão
                        </div>
                      </div>
                    )}

                    <div className="pt-[0.2mm] text-center">
                      <div className="mx-auto w-full flex justify-center">
                        <Barcode128
                          value={activeBarcodeValue}
                          format={activeFormat}
                          height={barcodeHeight}
                          barWidth={barWidth}
                        />
                      </div>
                      <div className="mt-[0.6mm] font-mono text-[6.5pt] font-black tracking-wider uppercase leading-none text-black">
                        {activeFormat === 'EAN13' ? `EAN: ${activeBarcodeValue}` : `CÓD: ${activeBarcodeValue}`}
                      </div>
                    </div>

                    <div className="mt-[0.5mm] border-t border-black pt-[0.3mm] text-center font-mono text-[5pt] font-bold uppercase text-black leading-none truncate whitespace-nowrap">
                      cyberinformatica.tech · Loja
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between border-b border-black pb-[0.8mm] font-mono text-[6.5pt] font-bold uppercase leading-none">
                      <span>CYBER INFORMÁTICA</span>
                      <span>{item.shelf_location ? `${item.shelf_location} · ${monthYear}` : monthYear}</span>
                    </div>

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

                    {showPrice && (
                      <div className="my-[0.4mm] flex items-baseline justify-between border-y border-black py-[0.6mm] leading-none">
                        <span className="font-mono text-[5.8pt] font-bold uppercase">VALOR:</span>
                        <span className="font-mono text-[11.8pt] font-black tracking-tight text-black">
                          R$ {price}
                        </span>
                      </div>
                    )}

                    <div className="pt-[0.4mm] text-center">
                      <div className="mx-auto w-full flex justify-center">
                        <Barcode128
                          value={activeBarcodeValue}
                          format={activeFormat}
                          height={Math.min(barcodeHeight, 38)}
                          barWidth={barWidth}
                        />
                      </div>
                      <div className="mt-[0.5mm] font-mono text-[6.5pt] font-black tracking-wider uppercase leading-none text-black">
                        {activeFormat === 'EAN13' ? `EAN: ${activeBarcodeValue}` : `CÓD: ${activeBarcodeValue}`}
                      </div>
                    </div>
                  </>
                )
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        @page {
          size: ${is40x60Any ? '40mm 60mm' : (labelFormat === '60x40' ? '60mm 40mm' : '50mm 40mm')};
          margin: 0 !important;
        }
        @media print {
          *, *::before, *::after {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            width: ${labelWidthMm}mm !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
          }
          header, nav, aside, footer, .no-print, [class*="print:hidden"] {
            display: none !important;
          }
          body > div, main, .label-print-container {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            max-width: none !important;
            width: ${labelWidthMm}mm !important;
            height: auto !important;
            max-height: none !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            display: block !important;
            overflow: visible !important;
          }
          .label-thermal-item {
            width: ${labelFormat === '40x60' ? '38mm' : `${labelWidthMm}mm`} !important;
            height: ${labelHeightMm}mm !important;
            max-width: ${labelFormat === '40x60' ? '38mm' : `${labelWidthMm}mm`} !important;
            max-height: ${labelHeightMm}mm !important;
            min-height: 0 !important;
            margin: ${labelFormat === '40x60' ? '0 1mm' : '0 auto'} !important;
            padding: ${is40x60Landscape ? '0' : (labelFormat === '40x60' ? '2.5mm 1.5mm' : (labelFormat === '60x40' ? '2mm 3mm' : '2mm 2.5mm'))} !important;
            border: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            position: relative !important;
            overflow: hidden !important;
            page-break-after: always !important;
            break-after: page !important;
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