'use client';

import { useState } from 'react';
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
  const [mode, setMode] = useState<'40x60' | '58mm'>('40x60');
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

  const copiesArray = Array.from({ length: Math.max(1, Math.min(20, copies)) });
  const isKnupThermal = mode === '40x60';
  const labelWidthMm = 40;
  const labelHeightMm = 52;

  // Função de impressão isolada para garantir 1 página única no Microsoft Edge
  const handlePrint = () => {
    if (!isKnupThermal) {
      window.print();
      return;
    }

    const frameId = 'thermal-os-print-frame';
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
          <title>Etiqueta OS 40x60mm</title>
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
            .label-os-thermal {
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
            .label-os-thermal:last-child {
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
      {/* Barra de Controles (Oculta na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl border-2 border-zinc-950 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              {isKnupThermal ? 'Knup KP-IM608 · 40x60mm' : 'MPT-II · 58mm'}
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

        {/* Seletor de Tipo de Impressora */}
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
            📱 Knup KP-IM608 (Adesiva 40x60 mm)
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
                  <option value="admin">Painel Interno (/admin/os/{osId})</option>
                  <option value="status">Página Pública do Cliente (/status?os={osNumberStr})</option>
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

            {/* Guia de Configuração Crítica do Microsoft Edge */}
            <div className="rounded border-2 border-blue-500 bg-blue-50 p-3 text-xs text-blue-950">
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

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-200">
              <div className="font-mono text-[11px] text-zinc-600">
                Bobina: <strong>40 x 60 mm (Em Pé / Retrato)</strong>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
              >
                🖨️ Imprimir {copies > 1 ? `${copies} Etiquetas` : 'Etiqueta'} (40x60mm)
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

      {/* ============ MODO 1: ETIQUETA ADESIVA 40x60mm C/ QR CODE (KNUP KP-IM608) ============ */}
      {isKnupThermal ? (
        <div className="label-print-container flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
          {copiesArray.map((_, idx) => (
            <div
              key={idx}
              className="label-os-thermal border-2 border-dashed border-zinc-400 bg-white text-black shadow-sm print:border-0 print:shadow-none"
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
                pageBreakAfter: idx < copiesArray.length - 1 ? 'always' : 'auto',
                breakAfter: idx < copiesArray.length - 1 ? 'page' : 'auto',
              }}
            >
              {/* 1. Cabeçalho: Loja + Data */}
              <div className="flex items-center justify-between border-b border-black pb-[0.3mm] font-mono text-[6pt] font-black uppercase leading-none">
                <span>CYBER INFORMÁTICA</span>
                <span>{createdDate}</span>
              </div>

              {/* 2. Destaque da OS (Fundo Branco Puro, sem dithering cinza) */}
              <div className="border-2 border-black p-[0.5mm] text-center bg-white">
                <div className="font-mono text-[5pt] font-black uppercase tracking-wider text-black leading-none">
                  ORDEM DE SERVIÇO
                </div>
                <div className="mt-[0.2mm] font-mono text-[10.5pt] font-black tracking-tight leading-none text-black">
                  {osNumberStr}
                </div>
              </div>

              {/* 3. QR Code Centralizado em Destaque */}
              <div className="flex flex-col items-center justify-center">
                <div className="border border-black p-[0.3mm] bg-white">
                  <QRCodeImage
                    value={qrUrl}
                    size={60}
                    alt={`QR Code ${osNumberStr}`}
                    className="block w-[13.5mm] h-[13.5mm]"
                  />
                </div>
                <div className="mt-[0.2mm] font-mono text-[4.8pt] font-black tracking-wider uppercase text-black leading-none">
                  BIPE P/ ABRIR NO SISTEMA
                </div>
              </div>

              {/* 4. Dados do Cliente e Aparelho */}
              <div className="border-t border-black pt-[0.3mm] leading-tight">
                <div className="truncate font-sans text-[7.2pt] font-black uppercase text-black">
                  CLI: {customerName}
                </div>
                {customerPhone && (
                  <div className="truncate font-mono text-[5.8pt] font-bold text-black">
                    TEL: {customerPhone}
                  </div>
                )}
                <div
                  className="mt-[0.2mm] font-sans text-[6.5pt] font-black uppercase leading-[1.08] text-black"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  EQ: {equipmentTitle}
                </div>
              </div>

              {/* 5. Senha / Acessórios / S/N */}
              <div className="border-t border-dashed border-black pt-[0.3mm] font-mono text-[5.5pt] font-bold leading-tight text-black truncate">
                {equipmentPassword ? `SENHA: ${equipmentPassword}` : 'SENHA: —'}
                {accessoriesInfo ? ` · ${accessoriesInfo}` : ''}
                {equipmentSerial ? ` · S/N:${equipmentSerial}` : ''}
              </div>

              {/* 6. Defeito Relatado */}
              <div
                className="border-t border-black pt-[0.3mm] font-sans text-[5.8pt] leading-[1.08] text-black"
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

              {/* 7. Rodapé */}
              <div className="border-t border-black pt-[0.3mm] text-center font-mono text-[4.8pt] font-bold uppercase text-black leading-none truncate whitespace-nowrap">
                ✦ BANCADA TÉCNICA · CYBER ✦
              </div>
            </div>
          ))}

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
              .label-os-thermal {
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
              <div className="border-b border-dashed border-black py-1 my-1 text-[11px] leading-tight">
                <div className="font-bold uppercase text-[9px]">[DEFEITO / SERVIÇO]</div>
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
