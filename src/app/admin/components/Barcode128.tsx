'use client';

import React from 'react';

/**
 * Tabela oficial de larguras (bar/space intercalados) do padrão Code 128 (valores 0 a 106).
 * Cada dígito representa a largura em módulos (1 a 4).
 * Símbolos 0..105 possuem 6 elementos (total 11 módulos).
 * O Stop Code (106) possui 7 elementos (total 13 módulos, terminando em barra de 2 módulos).
 */
const CODE128_PATTERNS: readonly string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

const START_CODE_B = 104;
const STOP_CODE = 106;

export function encodeCode128B(raw: string): { bars: Array<{ x: number; w: number }>; totalModules: number } {
  const clean = (raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');

  if (!clean) {
    return { bars: [], totalModules: 0 };
  }

  const codes: number[] = [START_CODE_B];
  let checksum = START_CODE_B;

  for (let i = 0; i < clean.length; i++) {
    const val = clean.charCodeAt(i) - 32;
    codes.push(val);
    checksum += val * (i + 1);
  }

  codes.push(checksum % 103);
  codes.push(STOP_CODE);

  const quietZone = 10;
  let cursor = quietZone;
  const bars: Array<{ x: number; w: number }> = [];

  for (const code of codes) {
    const pattern = CODE128_PATTERNS[code];
    for (let i = 0; i < pattern.length; i++) {
      const width = Number(pattern[i]);
      const isBar = i % 2 === 0;
      if (isBar) {
        bars.push({ x: cursor, w: width });
      }
      cursor += width;
    }
  }

  return {
    bars,
    totalModules: cursor + quietZone,
  };
}

export function Barcode128({
  value,
  height = 34,
  className = '',
}: {
  value: string;
  height?: number;
  className?: string;
}) {
  const { bars, totalModules } = encodeCode128B(value);

  if (bars.length === 0) return null;

  return (
    <svg
      viewBox={`0 0 ${totalModules} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      className={className}
      aria-label={`Código de barras ${value}`}
    >
      <rect x={0} y={0} width={totalModules} height={height} fill="#ffffff" />
      {bars.map((b, idx) => (
        <rect key={idx} x={b.x} y={0} width={b.w} height={height} fill="#000000" />
      ))}
    </svg>
  );
}
