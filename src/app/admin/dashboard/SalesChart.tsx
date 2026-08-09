// Gráfico de barras das vendas diárias — SVG puro, sem lib nenhuma (mesmo
// espírito do QR code do PIX: gerado localmente em vez de depender de
// pacote externo). Renderiza no servidor, zero JS enviado pro navegador;
// o hover com valor exato vem de <title> nativo do SVG (funciona sem
// JavaScript nenhum) e o dia de hoje é rotulado direto no gráfico (não dá
// pra rotular os 14 valores sem virar poluição visual, então só o mais
// importante fica escrito; o resto é lido pela altura da barra + hover).
//
// Uma cor só (azul, a mesma dos botões primários do resto do ERP) — isso
// é UMA série (vendas por dia), não categorias diferentes, então não há
// porque variar a cor por barra.

type DayPoint = {
  /** "seg", "ter"... já no fuso de Brasília */
  weekday: string;
  /** "05/08" pra tooltip/tabela */
  dateLabel: string;
  total: number;
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

export function SalesChart({ data }: { data: DayPoint[] }) {
  const W = 560;
  const H = 130;
  const PAD = 16; // margem horizontal — sem isso o rótulo de "hoje" estoura a borda direita
  const n = data.length;
  const slot = (W - PAD * 2) / n;
  const barW = Math.max(6, slot * 0.6);
  const max = Math.max(...data.map((d) => d.total), 1);
  // Headroom pra caber o rótulo de hoje acima da barra sem cortar.
  const usableH = H - 22;

  const totalPeriod = data.reduce((acc, d) => acc + d.total, 0);
  const ariaLabel = `Vendas dos últimos ${n} dias, total de ${fmtBRL(totalPeriod)}. Hoje: ${fmtBRL(
    data[data.length - 1]?.total ?? 0,
  )}.`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H + 24}`}
        className="w-full"
        role="img"
        aria-label={ariaLabel}
        preserveAspectRatio="xMidYMax meet"
      >
        {/* Linha de base */}
        <line x1={PAD} y1={H} x2={W - PAD} y2={H} stroke="#e2e8f0" strokeWidth={1} />

        {data.map((d, i) => {
          const barH = (d.total / max) * usableH;
          const x = PAD + i * slot + (slot - barW) / 2;
          const y = H - barH;
          const showWeekdayLabel = i % 2 === (n - 1) % 2;
          return (
            <g key={i}>
              <title>
                {d.dateLabel} ({d.weekday}) — {fmtBRL(d.total)}
              </title>
              <rect
                x={x}
                y={d.total > 0 ? y : H - 2}
                width={barW}
                height={d.total > 0 ? Math.max(2, barH) : 2}
                rx={3}
                fill={d.isToday ? '#1d4ed8' : '#93c5fd'}
              />
              {d.isToday && (
                <text
                  x={x + barW / 2}
                  y={Math.max(10, y - 6)}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill="#1d4ed8"
                >
                  {fmtBRLShort(d.total)}
                </text>
              )}
              {showWeekdayLabel && (
                <text
                  x={x + barW / 2}
                  y={H + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#94a3b8"
                >
                  {d.weekday}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <details className="mt-1">
        <summary className="cursor-pointer text-xs text-slate-400 hover:text-slate-600">
          Ver como tabela
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              <th className="pb-1 font-medium">Dia</th>
              <th className="pb-1 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((d, i) => (
              <tr key={i}>
                <td className="py-0.5 text-slate-700">
                  {d.dateLabel} ({d.weekday}){d.isToday ? ' · hoje' : ''}
                </td>
                <td className="py-0.5 text-right font-mono text-slate-900">{fmtBRL(d.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}
