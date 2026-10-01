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
  const [mode, setMode] = useState<'40x60' | '40x60-landscape' | '60x40' | '50x40' | '58mm'>('40x60-landscape');
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
  const is40x60Landscape = mode === '40x60-landscape';
  const is40x60Any = mode === '40x60' || is40x60Landscape;
  const isKnupThermal = is40x60Any || mode === '60x40' || mode === '50x40';
  const labelWidthMm = mode === '60x40' ? 60 : (is40x60Any ? 40 : 50);
  const labelHeightMm = is40x60Any ? 59 : 39;
  const paperHeightMm = is40x60Any ? 60 : 40;

  return (
    <>
      {/* Barra de Controles (Oculta na Impressão) */}
      <div className="print:hidden mx-auto mb-6 max-w-2xl border-2 border-zinc-950 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-white">
              {isKnupThermal ? `Knup KP-IM608 · ${is40x60Landscape ? '40x60 Paisagem (De Lado)' : `${mode}mm`}` : 'MPT-II · 58mm'}
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
            onClick={() => setMode('40x60-landscape')}
            className={`px-3 py-1.5 font-mono text-xs font-bold uppercase border cursor-pointer ${
              mode === '40x60-landscape'
                ? 'border-zinc-950 bg-zinc-950 text-white'
                : 'border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
            }`}
          >
            🔄 40x60mm De Lado (Paisagem / Estilo 60x40)
          </button>
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

            {/* Alerta de Configuração Crítica do Chrome */}
            <div className="rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <span className="text-base">⚠️</span> Para não gerar 3 páginas nem cortar a etiqueta:
              </div>
              <ol className="mt-1.5 list-decimal pl-4 space-y-1 font-mono text-[11px] text-amber-900">
                <li>No diálogo de impressão do Chrome, clique em <strong>Mais definições</strong> (More settings).</li>
                <li><strong>Desmarque</strong> a opção <strong>"Cabeçalhos e rodapés"</strong> (isso remove URL e data que empurram para 3 páginas).</li>
                <li>Altere <strong>Margens</strong> para <strong>"Nenhuma"</strong> (None).</li>
                <li>Altere <strong>Escala</strong> para <strong>100%</strong> (Padrão).</li>
              </ol>
              <p className="mt-1 text-[10px] text-amber-800">
                <em>O Chrome memoriza essas escolhas para a sua impressora KP-IM608, você só precisa configurar uma única vez!</em>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="font-mono text-[11px] text-zinc-600">
                Papel da <strong>Knup KP-IM608</strong>: <strong>{is40x60Landscape ? '40 x 60 mm (Paisagem / Girada 90°)' : (mode === '40x60' ? '40 x 60 mm (Vertical)' : (mode === '60x40' ? '60 x 40 mm' : '50 x 40 mm'))}</strong>.
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-zinc-950 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 cursor-pointer"
              >
                🖨️ Imprimir Etiqueta ({is40x60Landscape ? '40x60 De Lado' : `${mode}mm`})
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

      {/* Dica visual informativa sobre o Modo Paisagem */}
      {is40x60Landscape && (
        <div className="print:hidden mx-auto mb-4 max-w-2xl rounded border border-blue-200 bg-blue-50 px-3 py-2 text-center font-mono text-[11px] text-blue-900">
          🔄 <strong>Modo Paisagem Ativo:</strong> A etiqueta sai <strong>girada 90° de lado</strong> na bobina de 40mm. Ao colar no aparelho, você posiciona na <strong>horizontal (60mm de largura × 40mm de altura)</strong>!
        </div>
      )}

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
                padding: is40x60Landscape ? '0' : (mode === '40x60' ? '1.8mm 2.2mm' : (mode === '60x40' ? '1.6mm 2.8mm' : '1.6mm 2.2mm')),
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
                    padding: '1.6mm 2.6mm',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                  }}
                >
                  {/* 1. Cabeçalho: Loja + Data */}
                  <div className="flex items-center justify-between border-b border-black pb-[0.6mm] font-mono text-[6.5pt] font-bold uppercase leading-none">
                    <span>CYBER INFORMÁTICA</span>
                    <span>{createdDate}</span>
                  </div>

                  {/* 2. Bloco Principal: QR Code (Esquerda) + OS/Cliente/Aparelho (Direita) */}
                  <div className="my-[0.5mm] flex items-center gap-[2mm]">
                    <div className="shrink-0 border border-black p-[0.4mm] bg-white">
                      <QRCodeImage
                        value={qrUrl}
                        size={64}
                        alt={`QR Code ${osNumberStr}`}
                        className="block w-[16.5mm] h-[16.5mm]"
                      />
                    </div>

                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="font-mono text-[10.5pt] font-black tracking-tight leading-none text-black">
                        {osNumberStr}
                      </div>
                      <div className="mt-[0.5mm] truncate font-sans text-[7.5pt] font-bold uppercase text-black">
                        {customerName}
                      </div>
                      {customerPhone && (
                        <div className="truncate font-mono text-[6.5pt] text-black">
                          {customerPhone}
                        </div>
                      )}
                      <div
                        className="mt-[0.5mm] font-sans text-[7pt] font-black uppercase leading-[1.05] text-black"
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
                  <div className="border-t border-dashed border-black pt-[0.4mm] font-mono text-[6.5pt] font-bold leading-tight text-black truncate">
                    {equipmentPassword ? `SENHA: ${equipmentPassword}` : 'SENHA: —'}
                    {accessoriesInfo ? ` · ${accessoriesInfo}` : ''}
                    {equipmentSerial ? ` · S/N:${equipmentSerial}` : ''}
                  </div>

                  {/* 4. Defeito Relatado */}
                  <div
                    className="border-t border-black pt-[0.4mm] font-sans text-[6.5pt] leading-[1.08] text-black"
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
                </div>
              ) : mode === '40x60' ? (
                <>
                  {/* Layout Vertical 40x60mm (Preenchimento Completo da Altura) */}
                  {/* 1. Cabeçalho: Loja + Data */}
                  <div className="flex items-center justify-between border-b-2 border-black pb-[0.8mm] font-mono text-[6.5pt] font-black uppercase leading-none">
                    <span>CYBER INFORMÁTICA</span>
                    <span>{createdDate}</span>
                  </div>

                  {/* 2. Destaque da OS (Box Fechado) */}
                  <div className="my-[0.8mm] border-2 border-black p-[0.8mm] text-center bg-zinc-50">
                    <div className="font-mono text-[5.8pt] font-black uppercase tracking-wider text-black leading-none">
                      ORDEM DE SERVIÇO
                    </div>
                    <div className="mt-[0.5mm] font-mono text-[12pt] font-black tracking-tight leading-none text-black">
                      {osNumberStr}
                    </div>
                  </div>

                  {/* 3. QR Code Centralizado em Destaque */}
                  <div className="my-[0.5mm] flex flex-col items-center justify-center">
                    <div className="border border-black p-[0.4mm] bg-white">
                      <QRCodeImage
                        value={qrUrl}
                        size={80}
                        alt={`QR Code ${osNumberStr}`}
                        className="block w-[19mm] h-[19mm]"
                      />
                    </div>
                    <div className="mt-[0.4mm] font-mono text-[5.2pt] font-black tracking-wider uppercase text-black leading-none">
                      BIPE P/ ABRIR NO SISTEMA
                    </div>
                  </div>

                  {/* 4. Dados do Cliente e Aparelho */}
                  <div className="border-t border-black pt-[0.8mm] leading-tight">
                    <div className="truncate font-sans text-[7.8pt] font-black uppercase text-black">
                      CLI: {customerName}
                    </div>
                    {customerPhone && (
                      <div className="truncate font-mono text-[6.5pt] text-zinc-900">
                        TEL: {customerPhone}
                      </div>
                    )}
                    <div
                      className="mt-[0.5mm] font-sans text-[7.2pt] font-black uppercase leading-[1.08] text-black"
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
                  <div className="border-t border-dashed border-black pt-[0.6mm] font-mono text-[6.2pt] font-bold leading-tight text-black truncate">
                    {equipmentPassword ? `SENHA: ${equipmentPassword}` : 'SENHA: —'}
                    {accessoriesInfo ? ` · ${accessoriesInfo}` : ''}
                    {equipmentSerial ? ` · S/N:${equipmentSerial}` : ''}
                  </div>

                  {/* 6. Defeito Relatado */}
                  <div
                    className="border-t border-black pt-[0.6mm] font-sans text-[6.5pt] leading-[1.08] text-black"
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
                  <div className="mt-[0.5mm] border-t border-black pt-[0.5mm] text-center font-mono text-[5.2pt] font-bold uppercase text-black leading-none">
                    ✦ BANCADA TÉCNICA · CYBER INFORMÁTICA ✦
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
              size: ${is40x60Any ? '40mm 60mm' : (mode === '60x40' ? '60mm 40mm' : '50mm 40mm')};
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
              .label-os-thermal {
                width: ${labelWidthMm}mm !important;
                height: ${labelHeightMm}mm !important;
                max-width: ${labelWidthMm}mm !important;
                max-height: ${labelHeightMm}mm !important;
                margin: 0 !important;
                padding: ${is40x60Landscape ? '0' : (mode === '40x60' ? '1.8mm 2.2mm' : (mode === '60x40' ? '1.6mm 2.8mm' : '1.6mm 2.2mm'))} !important;
                border: 0 !important;
                box-shadow: none !important;
                background: #ffffff !important;
                color: #000000 !important;
                position: relative !important;
                overflow: hidden !important;
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
