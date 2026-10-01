'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeImage } from '@/app/admin/components/QRCode';
import { EscPosLabelButton } from './EscPosLabelButton';

interface OSLabelClientProps {
  osId: string;
  shortId: string;
  osNumberStr: string;
  createdDate: string;
  customerName: string;
  customerPhone: string;
  equipmentTitle: string;
  equipmentSerial: string;
  equipmentPassword: string;
  accessoriesInfo: string;
  reportedDefect: string;
  plainText58mm: string;
}

export function OSLabelClient({
  osId,
  shortId,
  osNumberStr,
  createdDate,
  customerName,
  customerPhone,
  equipmentTitle,
  equipmentSerial,
  equipmentPassword,
  accessoriesInfo,
  reportedDefect,
  plainText58mm,
}: OSLabelClientProps) {
  const [mode, setMode] = useState<'40x60' | '60x40' | '50x40' | '58mm'>('40x60');
  const [qrTarget, setQrTarget] = useState<'admin' | 'status'>('admin');
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
  const isKnupThermal = mode === '40x60' || mode === '60x40' || mode === '50x40';
  const labelWidthMm = mode === '60x40' ? 60 : (mode === '40x60' ? 40 : 50);
  const labelHeightMm = mode === '40x60' ? 59 : 39;
  const paperHeightMm = mode === '40x60' ? 60 : 40;

  return (
    <>
      {/* Barra de Controles (Oculta na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl border-2 border-zinc-950 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              {isKnupThermal ? `Knup KP-IM608 · ${mode}mm` : 'MPT-II · 58mm'}
            </span>
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-950">
              Etiqueta Interna de Dispositivo (OS)
            </span>
          </div>
          <Link
            href={`/admin/os/${osId}`}
            className="font-mono text-xs font-bold text-zinc-950 underline underline-offset-4"
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
            ⭐ 40x60mm Vertical (Sua Bobina)
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
            🧾 Bobina 58mm Texto Puro (MPT-II)
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
                  <option value="admin">
                    🔧 Acesso Direto à OS no Painel (/admin/os/{shortNumberBadge})
                  </option>
                  <option value="status">
                    🌐 Rastreio Público do Cliente (/status?os={osNumberStr})
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
                URL no QR: <code className="bg-zinc-100 px-1 py-0.5 text-zinc-900">{qrUrl}</code>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
              >
                🖨️ Imprimir Etiqueta ({mode}mm)
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white hover:bg-zinc-800 cursor-pointer"
            >
              🏷️ Imprimir via Navegador (58mm)
            </button>
            <EscPosLabelButton
              createdStr={createdDate}
              shortId={shortId}
              osNumber={osNumberStr}
              customerName={customerName}
              customerPhone={customerPhone || undefined}
              equipmentLine={equipmentTitle || undefined}
              defect={reportedDefect || undefined}
            />
          </div>
        )}
      </div>

      {/* ============ MODO 1: ETIQUETA ADESIVA 40x60mm / 60x40mm / 50x40mm C/ QR CODE (KNUP KP-IM608) ============ */}
      {isKnupThermal ? (
        <div className="label-print-container flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
          {copiesArray.map((_, idx) => (
            <div
              key={idx}
              className="label-os-thermal border-2 border-dashed border-zinc-400 bg-white text-black shadow-sm print:border-0 print:shadow-none"
              style={{
                width: `${labelWidthMm}mm`,
                height: `${labelHeightMm}mm`,
                padding: mode === '40x60' ? '1.8mm 2.2mm' : (mode === '60x40' ? '1.6mm 2.8mm' : '1.6mm 2.2mm'),
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                overflow: 'hidden',
                pageBreakAfter: idx < copiesArray.length - 1 ? 'always' : 'auto',
                breakAfter: idx < copiesArray.length - 1 ? 'page' : 'auto',
              }}
            >
              {mode === '40x60' ? (
                <>
                  {/* Layout Vertical 40x60mm */}
                  {/* 1. Cabeçalho: Loja + Data */}
                  <div className="flex items-center justify-between border-b border-black pb-[0.8mm] font-mono text-[6.5pt] font-bold uppercase leading-none">
                    <span>CYBER INFORMÁTICA</span>
                    <span>{createdDate}</span>
                  </div>

                  {/* 2. Destaque Grande da OS */}
                  <div className="my-[0.4mm] text-center">
                    <div className="font-mono text-[11.5pt] font-black tracking-tight leading-none text-black">
                      {osNumberStr}
                    </div>
                  </div>

                  {/* 3. QR Code Centralizado em Destaque */}
                  <div className="my-[0.4mm] flex justify-center">
                    <div className="border border-black p-[0.4mm] bg-white">
                      <QRCodeImage
                        value={qrUrl}
                        size={76}
                        alt={`QR Code ${osNumberStr}`}
                        className="block w-[19mm] h-[19mm]"
                      />
                    </div>
                  </div>

                  {/* 4. Dados do Cliente e Aparelho */}
                  <div className="border-t border-black pt-[0.6mm] leading-tight">
                    <div className="truncate font-sans text-[7.5pt] font-bold uppercase text-black">
                      {customerName}
                    </div>
                    {customerPhone && (
                      <div className="truncate font-mono text-[6.5pt] text-black">
                        {customerPhone}
                      </div>
                    )}
                    <div
                      className="mt-[0.4mm] font-sans text-[7pt] font-black uppercase leading-[1.05] text-black"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {equipmentTitle}
                    </div>
                  </div>

                  {/* 5. Senha / Acessórios / S/N */}
                  <div className="border-t border-dashed border-black pt-[0.5mm] font-mono text-[6.2pt] font-bold leading-tight text-black truncate">
                    {equipmentPassword ? `SENHA: ${equipmentPassword}` : 'SENHA: —'}
                    {accessoriesInfo ? ` · ${accessoriesInfo}` : ''}
                    {equipmentSerial ? ` · S/N:${equipmentSerial}` : ''}
                  </div>

                  {/* 6. Defeito Relatado */}
                  <div
                    className="border-t border-black pt-[0.5mm] font-sans text-[6.5pt] leading-[1.08] text-black"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    <strong className="font-mono uppercase">DEF:</strong>{' '}
                    {reportedDefect || 'Verificar em bancada'}
                  </div>
                </>
              ) : (
                <>
                  {/* Layout Horizontal 60x40mm / 50x40mm */}
                  {/* 1. Cabeçalho: Loja + Data + Nº Curto */}
                  <div className="flex items-center justify-between border-b border-black pb-[0.8mm] font-mono text-[6.5pt] font-bold uppercase leading-none">
                    <span>CYBER INFORMÁTICA</span>
                    <span>{createdDate}</span>
                  </div>

                  {/* 2. Bloco Principal: QR Code (Esquerda) + OS/Cliente/Aparelho (Direita) */}
                  <div className="my-[0.6mm] flex items-center gap-[2mm]">
                    <div className="shrink-0 border border-black p-[0.4mm] bg-white">
                      <QRCodeImage
                        value={qrUrl}
                        size={mode === '60x40' ? 66 : 60}
                        alt={`QR Code ${osNumberStr}`}
                        className={`block ${mode === '60x40' ? 'w-[17.5mm] h-[17.5mm]' : 'w-[16mm] h-[16mm]'}`}
                      />
                    </div>

                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="font-mono text-[10.5pt] font-black tracking-tight leading-none text-black">
                        {osNumberStr}
                      </div>
                      <div className="mt-[0.6mm] truncate font-sans text-[7.5pt] font-bold uppercase text-black">
                        {customerName}
                      </div>
                      {customerPhone && (
                        <div className="truncate font-mono text-[6.5pt] text-black">
                          {customerPhone}
                        </div>
                      )}
                      <div
                        className="mt-[0.6mm] font-sans text-[7pt] font-black uppercase leading-[1.05] text-black"
                        style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {equipmentTitle}
                      </div>
                    </div>
                  </div>

                  {/* 3. Senha / Acessórios / S/N */}
                  <div className="border-t border-dashed border-black pt-[0.5mm] font-mono text-[6.5pt] font-bold leading-tight text-black truncate">
                    {equipmentPassword ? `SENHA: ${equipmentPassword}` : 'SENHA: —'}
                    {accessoriesInfo ? ` · ${accessoriesInfo}` : ''}
                    {equipmentSerial ? ` · S/N:${equipmentSerial}` : ''}
                  </div>

                  {/* 4. Defeito Relatado (Resumo Prático de Bancada) */}
                  <div
                    className="border-t border-black pt-[0.5mm] font-sans text-[6.5pt] leading-[1.08] text-black"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    <strong className="font-mono uppercase">DEF:</strong>{' '}
                    {reportedDefect || 'Verificar em bancada'}
                  </div>
                </>
              )}
            </div>
          ))}

          <style>{`
            @page {
              size: ${mode === '40x60' ? '40mm 60mm' : (mode === '60x40' ? '60mm 40mm' : '50mm 40mm')};
              margin: 0 !important;
            }
            @media print {
              html, body {
                width: ${labelWidthMm}mm !important;
                height: ${paperHeightMm}mm !important;
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
              .label-os-thermal {
                width: ${labelWidthMm}mm !important;
                height: ${labelHeightMm}mm !important;
                max-width: ${labelWidthMm}mm !important;
                max-height: ${labelHeightMm}mm !important;
                margin: 0 !important;
                padding: ${mode === '40x60' ? '1.8mm 2.2mm' : (mode === '60x40' ? '1.6mm 2.8mm' : '1.6mm 2.2mm')} !important;
                border: 0 !important;
                box-shadow: none !important;
                background: #ffffff !important;
                color: #000000 !important;
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
        /* ============ MODO 2 (LEGADO): BOBINA 58MM TEXTO PURO (MPT-II) ============ */
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
              CYBER INFORMATICA · {createdDate}
            </div>

            <div className="text-center py-1.5 border-b-2 border-black my-1">
              <div className="text-xl font-black tracking-tight leading-none">{shortId}</div>
              <div className="text-xs font-bold mt-0.5">CODIGO OS: #{osNumberStr}</div>
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

            {reportedDefect && (
              <div className="border-b border-dashed border-black py-1 my-1 text-[10px] leading-tight">
                <div className="font-bold uppercase text-[9px]">[SERVICO / DEFEITO]</div>
                <div className="break-words">{reportedDefect}</div>
              </div>
            )}

            <div className="pt-1 text-center text-[9px] leading-tight font-bold uppercase">
              <div>RASTREIO: cyberinformatica.tech</div>
              <div className="text-[10px] font-black mt-0.5">DIGITE A OS: {osNumberStr}</div>
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
