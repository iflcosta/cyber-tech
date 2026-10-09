'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeImage } from '@/app/admin/components/QRCode';
import { Barcode128 } from '@/app/admin/components/Barcode128';
import { EscPosReadyLabelButton } from './EscPosReadyLabelButton';

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

interface OSReadyLabelClientProps {
  osId: string;
  shortId: string;
  osNumberStr: string;
  readyDateStr: string;
  customerName: string;
  customerPhone: string;
  equipmentTitle: string;
  equipmentSerial?: string;
  repairNotes: string;
  laborCost: number;
  partsTotal: number;
  grandTotal: number;
  partsList?: string[];
  totalPaid: number;
  remainingToPay: number;
  isPaid: boolean;
  accessoriesInfo?: string;
  plainText58mm: string;
}

export function OSReadyLabelClient({
  osId,
  shortId,
  osNumberStr,
  readyDateStr,
  customerName,
  customerPhone,
  equipmentTitle,
  equipmentSerial,
  repairNotes,
  laborCost,
  partsTotal,
  grandTotal,
  partsList = [],
  totalPaid,
  remainingToPay,
  isPaid,
  accessoriesInfo,
  plainText58mm,
}: OSReadyLabelClientProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'40x60' | '40x60-landscape' | '60x40' | '50x40' | '58mm'>('40x60');
  const [qrTarget, setQrTarget] = useState<'status' | 'admin'>('status');
  const [copies, setCopies] = useState(1);

  const origin =
    typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://cyberinformatica.tech';

  const qrUrl =
    qrTarget === 'admin'
      ? `${origin}/admin/os/${osId}`
      : `${origin}/status?os=${encodeURIComponent(osNumberStr)}`;

  const shortNumberBadge = osNumberStr.replace(/^OS-\d{4}-/i, '#');
  const copiesArray = Array.from({ length: Math.max(1, Math.min(20, copies)) });
  const is40x60Landscape = mode === '40x60-landscape';
  const is40x60Any = mode === '40x60' || is40x60Landscape;
  const isKnupThermal = is40x60Any || mode === '60x40' || mode === '50x40';
  const labelWidthMm = mode === '60x40' ? 60 : (is40x60Any ? 40 : 50);
  const labelHeightMm = mode === '40x60' ? 55 : (is40x60Landscape ? 58 : (mode === '60x40' ? 38 : 38));

  // Disparo automático quando aberto via fluxo de conclusão (?autoprint=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const c = params.get('copies');
      if (c) {
        setCopies(Math.max(1, parseInt(c, 10) || 1));
      }
      if (params.get('autoprint') === '1') {
        const timer = setTimeout(() => {
          window.print();
          const returnTimer = setTimeout(() => {
            router.push(`/admin/os/${osId}`);
          }, 1500);
          return () => clearTimeout(returnTimer);
        }, 400);
        return () => clearTimeout(timer);
      }
    }
  }, [osId, router]);

  return (
    <>
      {/* Barra de Controles (Oculta na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl border-2 border-zinc-950 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-600 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              ✓ OS PRONTA
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
              Etiqueta de Conclusão e Entrega ({shortNumberBadge})
            </span>
          </div>
          <Link
            href={`/admin/os/${osId}`}
            className="font-mono text-xs font-bold text-zinc-950 underline underline-offset-4 hover:text-zinc-700"
          >
            ← Voltar para OS
          </Link>
        </div>

        {/* Seletor de Impressora / Formato */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('40x60')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border cursor-pointer ${
              mode === '40x60'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            📱 40x60mm Em Pé (Vertical / Retrato)
          </button>
          <button
            type="button"
            onClick={() => setMode('40x60-landscape')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border cursor-pointer ${
              mode === '40x60-landscape'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            🔄 40x60mm De Lado (Paisagem)
          </button>
          <button
            type="button"
            onClick={() => setMode('60x40')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border cursor-pointer ${
              mode === '60x40'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            60x40mm Horizontal
          </button>
          <button
            type="button"
            onClick={() => setMode('50x40')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border cursor-pointer ${
              mode === '50x40'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            50x40mm
          </button>
          <button
            type="button"
            onClick={() => setMode('58mm')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border cursor-pointer ${
              mode === '58mm'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            🧾 Bobina 58mm (MPT-II Bluetooth)
          </button>
        </div>

        {isKnupThermal ? (
          <div className="mt-4 space-y-3 border-t border-zinc-200 pt-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block sm:col-span-2">
                <span className="block font-mono text-[11px] font-bold uppercase text-zinc-700">
                  Destino do QR Code ao escanear com o celular
                </span>
                <select
                  value={qrTarget}
                  onChange={(e) => setQrTarget(e.target.value as 'admin' | 'status')}
                  className="mt-1 w-full border border-zinc-400 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-950"
                >
                  <option value="status">
                    🌐 Rastreio Público do Cliente (/status?os={osNumberStr})
                  </option>
                  <option value="admin">
                    🔧 Acesso Direto à OS no Painel (/admin/os/{shortNumberBadge})
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
                  max={20}
                  value={copies}
                  onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="mt-1 w-full border border-zinc-400 px-2.5 py-1.5 font-mono text-xs font-bold text-zinc-950"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="font-mono text-[11px] text-zinc-600">
                Papel <strong>Knup KP-IM608</strong>: <strong>{is40x60Landscape ? '40 x 60 mm (Paisagem / Girada 90°)' : (mode === '40x60' ? '40 x 60 mm (Vertical)' : (mode === '60x40' ? '60 x 40 mm' : '50 x 40 mm'))}</strong>.
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
                >
                  🖨️ Imprimir Etiqueta ({is40x60Landscape ? '40x60 De Lado' : `${mode}mm`})
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="border border-zinc-950 bg-black px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
            >
              🏷️ Imprimir via Navegador (58mm)
            </button>
            <EscPosReadyLabelButton
              readyDateStr={readyDateStr}
              shortId={shortId}
              osNumber={osNumberStr}
              customerName={customerName}
              customerPhone={customerPhone || undefined}
              equipmentLine={equipmentTitle || undefined}
              repairNotes={repairNotes || undefined}
              laborCost={laborCost}
              partsTotal={partsTotal}
              grandTotal={grandTotal}
              isPaid={isPaid}
              remainingToPay={remainingToPay}
              accessoriesInfo={accessoriesInfo}
            />
          </div>
        )}
      </div>

      {/* Dica visual informativa sobre o Modo Paisagem */}
      {is40x60Landscape && (
        <div className="print:hidden mx-auto mb-4 max-w-2xl border-2 border-zinc-950 bg-zinc-100 px-3 py-2 text-center font-mono text-[11px] font-bold uppercase text-zinc-950">
          🔄 <strong>Modo Paisagem Ativo:</strong> A etiqueta sai <strong>girada 90° de lado</strong> na bobina de 40mm. Ao colar no aparelho, você posiciona na <strong>horizontal (60mm de largura × 40mm de altura)</strong>!
        </div>
      )}

      {/* ============ MODO 1: ETIQUETA ADESIVA 40x60mm / 60x40mm / 50x40mm KNUP KP-IM608 ============ */}
      {isKnupThermal ? (
        <div className="label-print-container flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
          {copiesArray.map((_, idx) => (
            <div
              key={idx}
              className="label-os-thermal border-2 border-dashed border-zinc-400 bg-white text-black shadow-sm print:border-0 print:shadow-none"
              style={{
                width: mode === '40x60' ? '38mm' : `${labelWidthMm}mm`,
                height: `${labelHeightMm}mm`,
                padding: is40x60Landscape ? '0' : (mode === '40x60' ? '2mm 1.5mm' : (mode === '60x40' ? '2mm 3mm' : '2mm 2.5mm')),
                margin: mode === '40x60' ? '0 1mm' : '0 auto',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: is40x60Landscape ? 'center' : 'space-between',
                alignItems: is40x60Landscape ? 'center' : 'stretch',
                position: 'relative',
                overflow: 'hidden',
                pageBreakAfter: idx < copiesArray.length - 1 ? 'always' : 'auto',
                breakAfter: idx < copiesArray.length - 1 ? 'page' : 'auto',
              }}
            >
              {mode === '40x60-landscape' ? (
                /* Layout Paisagem Rotacionada 90° (Design 60x40mm na bobina 40x60mm) */
                <div
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: '58mm',
                    height: '38mm',
                    transform: 'translate(-50%, -50%) rotate(90deg)',
                    transformOrigin: 'center center',
                    padding: '1.5mm 2.5mm',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                  }}
                >
                  {/* Topo: OS + Status Pronto + Data */}
                  <div className="flex items-center justify-between border-b border-black pb-[0.5mm] font-mono text-[6pt] font-bold uppercase leading-none">
                    <div className="flex items-center gap-1">
                      <span className="bg-black text-white px-1 py-[0.2mm] text-[5.5pt] font-black">
                        ✓ PRONTO
                      </span>
                      <span className="font-mono text-[8pt] font-black">{osNumberStr}</span>
                    </div>
                    <span>{readyDateStr}</span>
                  </div>

                  {/* Miolo: Coluna Esquerda (QR/Barcode) e Coluna Direita (Dados) */}
                  <div className="my-[0.4mm] flex items-center gap-[2mm]">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="border border-black p-[0.3mm] bg-white">
                        <QRCodeImage
                          value={qrUrl}
                          size={54}
                          alt={`QR Code ${osNumberStr}`}
                          className="block w-[14.5mm] h-[14.5mm]"
                        />
                      </div>
                      <div className="mt-[0.5mm] w-[15mm]">
                        <Barcode128
                          value={osNumberStr.replace(/\D/g, '') || shortId}
                          height={12}
                          barWidth={1}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 leading-tight space-y-[0.4mm]">
                      <div className="truncate font-sans text-[7.5pt] font-black uppercase text-black">
                        {customerName}
                      </div>
                      {customerPhone && (
                        <div className="truncate font-mono text-[6pt] text-black">
                          {customerPhone}
                        </div>
                      )}
                      <div className="truncate font-sans text-[6pt] font-bold text-black border-t border-dashed border-black/40 pt-[0.3mm]">
                        {equipmentTitle}
                      </div>
                      <div
                        className="font-sans text-[5.8pt] leading-[1.05] text-black"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        <strong>SERV:</strong> {repairNotes || 'Serviço concluído na bancada'}
                      </div>
                    </div>
                  </div>

                  {/* Bloco de Valor e Situação de Pagamento */}
                  <div className="border-t border-black pt-[0.4mm] flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-[6pt] font-bold uppercase">TOTAL:</span>
                      <span className="font-mono text-[9pt] font-black">{fmtBRL(grandTotal)}</span>
                    </div>
                    <span className="bg-black text-white px-1 py-[0.2mm] font-mono text-[5.5pt] font-black tracking-tight">
                      {isPaid ? '✓ PAGO' : `A PAGAR: ${fmtBRL(remainingToPay > 0 ? remainingToPay : grandTotal)}`}
                    </span>
                  </div>

                  {/* Rodapé: Devolução e Garantia */}
                  <div className="border-t border-dashed border-black pt-[0.3mm] flex items-center justify-between font-mono text-[5pt] text-black">
                    <span className="truncate">
                      {accessoriesInfo ? `⚠️ DEVOLVER: ${accessoriesInfo}` : 'Garantia legal: 90 dias'}
                    </span>
                    <span className="font-bold">CYBER INFORMÁTICA</span>
                  </div>
                </div>
              ) : mode === '40x60' ? (
                /* Layout Vertical 40x60mm Ultra Completo e Otimizado */
                <>
                  {/* 1. Topo: Cabeçalho com Número da OS e Selo de Concluído */}
                  <div className="flex items-baseline justify-between border-b-2 border-black pb-[0.6mm] leading-none">
                    <div className="flex items-baseline gap-1">
                      <span className="bg-black text-white px-1 py-[0.3mm] font-mono text-[6pt] font-black uppercase">
                        ✓ PRONTO
                      </span>
                      <span className="font-mono text-[11.5pt] font-black tracking-tight text-black">
                        {osNumberStr}
                      </span>
                    </div>
                    <span className="font-mono text-[6pt] font-bold text-black shrink-0 ml-1">
                      {readyDateStr}
                    </span>
                  </div>

                  {/* 2. Cliente e Aparelho */}
                  <div className="pt-[0.6mm] leading-tight space-y-[0.3mm]">
                    <div className="truncate font-sans text-[7.5pt] font-black uppercase text-black">
                      CLI: {customerName}
                    </div>
                    <div className="flex items-center justify-between font-mono text-[6pt] font-bold text-black">
                      <span className="truncate">{customerPhone || 'Sem telefone'}</span>
                      {equipmentSerial ? <span className="truncate">S/N: {equipmentSerial}</span> : null}
                    </div>
                    <div className="truncate font-sans text-[6.5pt] font-bold text-black border-t border-dashed border-black/40 pt-[0.3mm]">
                      {equipmentTitle}
                    </div>
                  </div>

                  {/* 3. Serviço Realizado / Informações Finais (Destaque) */}
                  <div className="border-t border-black pt-[0.5mm] my-[0.4mm]">
                    <div className="font-mono text-[5.5pt] font-black uppercase text-black">
                      SERVIÇO EXECUTADO:
                    </div>
                    <div
                      className="font-sans text-[6.5pt] font-bold leading-[1.1] text-black"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {repairNotes || 'Serviço realizado e verificado na bancada'}
                    </div>
                    {partsList.length > 0 && (
                      <div className="truncate font-sans text-[5.5pt] text-black mt-[0.2mm]">
                        <strong>PEÇAS:</strong> {partsList.join(', ')}
                      </div>
                    )}
                  </div>

                  {/* 4. Bloco Financeiro em Grande Destaque */}
                  <div className="border-2 border-black p-[0.6mm] my-[0.4mm] bg-zinc-50 flex items-center justify-between leading-none">
                    <div>
                      <div className="font-mono text-[5.5pt] font-bold text-zinc-600 uppercase">
                        VALOR TOTAL
                      </div>
                      <div className="font-mono text-[11pt] font-black text-black">
                        {fmtBRL(grandTotal)}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-black text-white px-1.5 py-[0.4mm] font-mono text-[6.5pt] font-black uppercase tracking-tight">
                        {isPaid
                          ? '✓ PAGO'
                          : `A PAGAR: ${fmtBRL(remainingToPay > 0 ? remainingToPay : grandTotal)}`}
                      </span>
                    </div>
                  </div>

                  {/* 5. Código de Barras da OS para Leitor de Balcão */}
                  <div className="my-[0.3mm] flex flex-col items-center">
                    <div className="w-[34mm]">
                      <Barcode128
                        value={osNumberStr.replace(/\D/g, '') || shortId}
                        height={16}
                        barWidth={1}
                      />
                    </div>
                    <span className="font-mono text-[5.5pt] font-bold text-black mt-[0.2mm]">
                      OS #{osNumberStr}
                    </span>
                  </div>

                  {/* 6. Rodapé: Devolução de Acessórios & Garantia */}
                  <div className="border-t border-black pt-[0.4mm] font-mono text-[5.5pt] leading-tight text-black flex items-center justify-between">
                    <span className="truncate">
                      {accessoriesInfo ? `⚠️ DEVOLVER: ${accessoriesInfo}` : 'Garantia: 90 dias'}
                    </span>
                    <span className="font-bold">CYBER</span>
                  </div>
                </>
              ) : (
                /* Layout Horizontal 60x40mm / 50x40mm */
                <>
                  {/* Topo */}
                  <div className="flex items-center justify-between border-b border-black pb-[0.6mm] font-mono text-[6pt] font-bold uppercase leading-none">
                    <div className="flex items-center gap-1">
                      <span className="bg-black text-white px-1 py-[0.2mm] text-[5pt] font-black">
                        ✓ PRONTO
                      </span>
                      <span className="font-mono text-[8.5pt] font-black">{osNumberStr}</span>
                    </div>
                    <span>{readyDateStr}</span>
                  </div>

                  {/* Bloco Central */}
                  <div className="my-[0.5mm] flex items-center gap-[2mm]">
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="border border-black p-[0.3mm] bg-white">
                        <QRCodeImage
                          value={qrUrl}
                          size={56}
                          alt={`QR Code ${osNumberStr}`}
                          className="block w-[15mm] h-[15mm]"
                        />
                      </div>
                      <div className="mt-[0.4mm] w-[16mm]">
                        <Barcode128
                          value={osNumberStr.replace(/\D/g, '') || shortId}
                          height={12}
                          barWidth={1}
                        />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 leading-tight space-y-[0.3mm]">
                      <div className="truncate font-sans text-[7.5pt] font-black uppercase text-black">
                        {customerName}
                      </div>
                      {customerPhone && (
                        <div className="truncate font-mono text-[6pt] text-black">
                          {customerPhone}
                        </div>
                      )}
                      <div className="truncate font-sans text-[6.5pt] font-bold text-black border-t border-dashed border-black/40 pt-[0.2mm]">
                        {equipmentTitle}
                      </div>
                      <div
                        className="font-sans text-[6pt] leading-[1.1] text-black"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        <strong>SERV:</strong> {repairNotes || 'Serviço concluído'}
                      </div>
                    </div>
                  </div>

                  {/* Bloco de Valor */}
                  <div className="border-t border-black pt-[0.4mm] flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="font-mono text-[6pt] font-bold">TOTAL:</span>
                      <span className="font-mono text-[9pt] font-black">{fmtBRL(grandTotal)}</span>
                    </div>
                    <span className="bg-black text-white px-1 py-[0.2mm] font-mono text-[6pt] font-black">
                      {isPaid ? '✓ PAGO' : `A PAGAR: ${fmtBRL(remainingToPay > 0 ? remainingToPay : grandTotal)}`}
                    </span>
                  </div>

                  {/* Rodapé */}
                  <div className="border-t border-dashed border-black pt-[0.3mm] flex items-center justify-between font-mono text-[5pt] text-black">
                    <span className="truncate">
                      {accessoriesInfo ? `⚠️ DEVOLVER: ${accessoriesInfo}` : 'Garantia legal: 90 dias'}
                    </span>
                    <span>CYBER INFORMÁTICA</span>
                  </div>
                </>
              )}
            </div>
          ))}

          <style>{`
            @page {
              size: ${is40x60Any ? '40mm 60mm' : (mode === '60x40' ? '60mm 40mm' : '50mm 40mm')};
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
              .label-os-thermal {
                width: ${mode === '40x60' ? '38mm' : `${labelWidthMm}mm`} !important;
                height: ${labelHeightMm}mm !important;
                max-width: ${mode === '40x60' ? '38mm' : `${labelWidthMm}mm`} !important;
                max-height: ${labelHeightMm}mm !important;
                min-height: 0 !important;
                margin: ${mode === '40x60' ? '0 1mm' : '0 auto'} !important;
                padding: ${is40x60Landscape ? '0' : (mode === '40x60' ? '2mm 1.5mm' : (mode === '60x40' ? '2mm 3mm' : '2mm 2.5mm'))} !important;
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
              .label-os-thermal:last-child {
                page-break-after: auto !important;
                break-after: auto !important;
              }
            }
          `}</style>
        </div>
      ) : (
        /* ============ MODO 2: BOBINA 58MM TEXTO PURO (MPT-II) ============ */
        <div className="flex justify-center print:block print:m-0">
          <div
            className="label-thermal border-2 border-zinc-950 bg-white text-black font-mono print:border-0"
            style={{
              width: '58mm',
              padding: '2mm 3mm',
              margin: '0 auto',
              boxSizing: 'border-box',
            }}
          >
            <div className="text-center text-[10px] tracking-widest font-bold border-b border-black pb-1 mb-1">
              CYBER INFORMATICA · PRONTO
            </div>

            <div className="text-center py-1.5 border-b-2 border-black my-1">
              <div className="text-xs font-bold uppercase bg-black text-white inline-block px-1">APARELHO PRONTO</div>
              <div className="text-xl font-black tracking-tight leading-none mt-1">{shortId}</div>
              <div className="text-xs font-bold mt-0.5">CODIGO OS: #{osNumberStr}</div>
              <div className="text-[9px] mt-0.5">{readyDateStr}</div>
            </div>

            <div className="border-b border-dashed border-black py-1 my-1 text-[11px] leading-tight">
              <div className="font-bold uppercase text-[9px]">[CLIENTE]</div>
              <div className="font-bold truncate">{customerName}</div>
              {customerPhone && <div className="text-[10px]">Tel: {customerPhone}</div>}
            </div>

            <div className="border-b border-dashed border-black py-1 my-1 text-[11px] leading-tight">
              <div className="font-bold uppercase text-[9px]">[EQUIPAMENTO]</div>
              <div className="font-bold break-words">{equipmentTitle}</div>
              {equipmentSerial && <div className="text-[10px]">S/N: {equipmentSerial}</div>}
            </div>

            {repairNotes && (
              <div className="border-b border-dashed border-black py-1 my-1 text-[10px] leading-tight">
                <div className="font-bold uppercase text-[9px]">[SERVICO REALIZADO]</div>
                <div className="break-words font-semibold">{repairNotes}</div>
              </div>
            )}

            <div className="border-b-2 border-black py-1.5 my-1 text-[11px] leading-tight">
              <div className="font-bold uppercase text-[9px]">[VALOR FINAL]</div>
              {laborCost > 0 && <div>Mao de Obra: {fmtBRL(laborCost)}</div>}
              {partsTotal > 0 && <div>Pecas: {fmtBRL(partsTotal)}</div>}
              <div className="text-sm font-black mt-1">TOTAL: {fmtBRL(grandTotal)}</div>
              <div className="font-bold mt-0.5">
                {isPaid ? '[ ✓ TOTAL PAGO ]' : `[ A PAGAR: ${fmtBRL(remainingToPay > 0 ? remainingToPay : grandTotal)} ]`}
              </div>
            </div>

            {accessoriesInfo && (
              <div className="border-b border-dashed border-black py-1 my-1 text-[10px] leading-tight font-bold">
                ⚠️ DEVOLVER: {accessoriesInfo}
              </div>
            )}

            <div className="pt-1 text-center text-[9px] leading-tight font-bold uppercase">
              <div>Garantia legal: 90 dias</div>
              <div>RASTREIO: cyberinformatica.tech</div>
              <div className="text-[10px] font-black mt-0.5">OS: #{osNumberStr}</div>
            </div>

            <pre className="sr-only">{plainText58mm}</pre>
          </div>

          <style>{`
            @page {
              size: 58mm auto;
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
                position: absolute;
                top: 0;
                left: 0;
                margin: 0 !important;
                padding: 2mm 2mm !important;
                background: white !important;
                color: black !important;
                width: 58mm !important;
                box-shadow: none !important;
                border: 0 !important;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
