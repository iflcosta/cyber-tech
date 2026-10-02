'use client';

import { useState } from 'react';
import Link from 'next/link';
import { QRCodeImage } from '@/app/admin/components/QRCode';

export function TestLabelClient() {
  const [copies, setCopies] = useState(1);
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const copiesArray = Array.from({ length: Math.max(1, Math.min(10, copies)) });

  return (
    <div className="space-y-6">
      {/* Barra Superior - Oculta na Impressão */}
      <div className="print:hidden border-2 border-zinc-950 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/configuracoes"
              className="border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition"
            >
              ← Voltar para Configurações
            </Link>
            <div>
              <h1 className="font-mono text-base font-black uppercase text-zinc-950">
                Teste de Impressão Knup KP-IM608 (40x60mm)
              </h1>
              <p className="font-mono text-xs text-zinc-600">
                Etiqueta de calibração térmica e alinhamento de bobina
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 font-mono text-xs font-bold text-zinc-800">
              <span>Cópias:</span>
              <input
                type="number"
                min={1}
                max={10}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-16 border-2 border-zinc-950 px-2 py-1 font-mono text-xs font-bold text-center"
              />
            </label>
            <button
              type="button"
              onClick={() => window.print()}
              className="border-2 border-zinc-950 bg-zinc-950 px-5 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition cursor-pointer"
            >
              🖨️ Imprimir Agora
            </button>
          </div>
        </div>

        {/* Instruções de calibração */}
        <div className="mt-4 border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950 font-mono">
          <p className="font-bold text-amber-900">⚠️ Configuração no Diálogo do Chrome:</p>
          <p className="mt-0.5">• Papel: <strong>40mm x 60mm</strong> (Retrato)</p>
          <p>• Margens: <strong>Nenhuma</strong> (None)</p>
          <p>• Cabeçalhos e rodapés: <strong>Desmarcado</strong></p>
        </div>
      </div>

      {/* Estilos de Impressão 40x60mm */}
      <style jsx global>{`
        @media print {
          @page {
            size: 40mm 60mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            width: 40mm !important;
          }
          header, nav, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Renderização da Etiqueta Térmica 40x60mm */}
      <div className="flex flex-col items-center gap-4 print:block print:m-0 print:p-0">
        {copiesArray.map((_, idx) => (
          <div
            key={idx}
            className="border-2 border-dashed border-zinc-400 bg-white text-black shadow-sm print:border-0 print:shadow-none"
            style={{
              width: '38mm',
              height: '55mm',
              padding: '2.5mm 1.5mm',
              margin: '0 1mm',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'stretch',
              position: 'relative',
              overflow: 'hidden',
              pageBreakAfter: idx < copiesArray.length - 1 ? 'always' : 'auto',
              breakAfter: idx < copiesArray.length - 1 ? 'page' : 'auto',
            }}
          >
            {/* 1. Topo: Identificador Direto da OS + Data */}
            <div className="flex items-baseline justify-between border-b-2 border-black pb-[0.8mm] leading-none">
              <span className="font-mono text-[12.5pt] font-black tracking-tight text-black">
                OS-2026-TESTE
              </span>
              <span className="font-mono text-[6.5pt] font-bold text-black shrink-0 ml-1">
                {dateStr}
              </span>
            </div>

            {/* 2. QR Code Centralizado */}
            <div className="my-[1.2mm] flex items-center justify-center">
              <QRCodeImage
                value="https://cyberinformatica.tech/status?os=TESTE"
                size={256}
                alt="QR Code Teste"
                className="block w-[22mm] h-[22mm]"
              />
            </div>

            {/* 3. Dados do Cliente */}
            <div className="border-t border-black pt-[0.8mm] leading-tight space-y-[0.4mm]">
              <div className="truncate font-sans text-[8pt] font-black uppercase text-black">
                CLIENTE TESTE BALCÃO
              </div>
              <div className="font-mono text-[6.5pt] text-black">
                (11) 99999-9999
              </div>
            </div>

            {/* 4. Aparelho e Senha */}
            <div className="border-t border-dashed border-black pt-[0.6mm] leading-tight">
              <div className="font-sans text-[7.5pt] font-bold uppercase text-black line-clamp-2">
                Notebook Dell Inspiron 15
              </div>
              <div className="font-mono text-[6pt] font-bold text-black mt-[0.3mm]">
                SENHA: 1234 · S/N: TEST-9988
              </div>
            </div>

            {/* 5. Defeito / Diagnóstico */}
            <div
              className="border-t border-black pt-[0.6mm] font-sans text-[6.5pt] leading-[1.08] text-black"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              <strong className="font-mono uppercase">DEF:</strong> Calibração de etiqueta Knup 40x60mm
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
