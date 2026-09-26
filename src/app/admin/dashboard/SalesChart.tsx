'use client';

// Gráfico de barras das vendas diárias — Padrão CIS-01 Stealth Industrial
// SVG puro, renderizado em alta definição sem dependências externas pesadas.

export type DayPoint = {
  /** "seg", "ter"... já no fuso de Brasília */
  weekday: string;
  /** "05/08" pra tooltip/tabela */
  dateLabel: string;
  total: number;
  count: number;
  isToday: boolean;
};

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtBRLShort(n: number): string {
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });
}

export function SalesChart({ data, showValues = true }: { data: DayPoint[]; showValues?: boolean }) {
  const W = 600;
  const H = 140;
  const PAD = 16;
  const n = data.length;
  const slot = (W - PAD * 2) / Math.max(n, 1);
  const barW = Math.max(8, slot * 0.55);
  const max = Math.max(...data.map((d) => d.total), 1);
  const usableH = H - 28;

  const totalPeriod = data.reduce((acc, d) => acc + d.total, 0);
  const ariaLabel = `Vendas dos últimos ${n} dias, total de ${fmtBRL(totalPeriod)}. Hoje: ${fmtBRL(
    data[data.length - 1]?.total ?? 0,
  )}.`;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H + 28}`}
        className="w-full h-auto overflow-visible select-none"
        role="img"
        aria-label={ariaLabel}
        preserveAspectRatio="xMidYMax meet"
      >
        {/* Linha de base da grade */}
        <line x1={PAD} y1={H} x2={W - PAD} y2={H} stroke="#d4d4d8" strokeWidth={1} />

        {data.map((d, i) => {
          const barH = (d.total / max) * usableH;
          const x = PAD + i * slot + (slot - barW) / 2;
          const y = H - barH;
          const showWeekdayLabel = i % 2 === (n - 1) % 2;

          return (
            <g key={i} className="group cursor-pointer">
              <title>
                {d.dateLabel} ({d.weekday}) — {showValues ? fmtBRL(d.total) : `${d.count} vendas`} ({d.count} vendas)
              </title>

              {/* Barra */}
              <rect
                x={x}
                y={d.total > 0 ? y : H - 2}
                width={barW}
                height={d.total > 0 ? Math.max(3, barH) : 2}
                className={`transition-colors ${
                  d.isToday
                    ? 'fill-zinc-950'
                    : d.total > 0
                    ? 'fill-zinc-700 hover:fill-zinc-950'
                    : 'fill-zinc-200'
                }`}
              />

              {/* Rótulo numérico de Hoje */}
              {d.isToday && showValues && d.total > 0 && (
                <text
                  x={x + barW / 2}
                  y={Math.max(12, y - 8)}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={800}
                  className="fill-zinc-950 font-mono"
                >
                  {fmtBRLShort(d.total)}
                </text>
              )}

              {/* Rótulo do dia da semana */}
              {showWeekdayLabel && (
                <text
                  x={x + barW / 2}
                  y={H + 18}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={d.isToday ? 800 : 600}
                  className={`font-mono uppercase tracking-wider ${
                    d.isToday ? 'fill-zinc-950' : 'fill-zinc-600'
                  }`}
                >
                  {d.weekday}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
