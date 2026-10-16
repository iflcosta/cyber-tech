'use client';

import { useState } from 'react';
import Link from 'next/link';

export type DREData = {
  periodLabel: string;
  salesGross: number;
  salesCount: number;
  laborGross: number;
  laborCount: number;
  partsGross: number;
  partsCount: number;
  totalGrossRevenue: number;
  partsCMV: number;
  grossMargin: number;
  technicianCommissions: number;
  cashBleedExpenses: number;
  cashBleedCount: number;
  netProfit: number;
  netMarginPct: number;
};

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function DREWidget({ data }: { data: DREData }) {
  const [showDetails, setShowDetails] = useState(true);
  const isProfitPositive = data.netProfit >= 0;

  return (
    <section className="border-2 border-zinc-950 bg-white p-4 sm:p-5 shadow-sm space-y-4">
      {/* HEADER DO DRE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-zinc-950 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center border border-zinc-950 bg-zinc-950 text-xs text-white font-mono font-bold">
              📊
            </span>
            <h2 className="text-base font-black uppercase tracking-tight text-zinc-950 font-mono">
              DRE Gerencial — Demonstrativo de Resultado
            </h2>
          </div>
          <p className="text-xs font-mono text-zinc-600 mt-0.5">
            Visão contábil e apuração de Lucro Líquido Real ({data.periodLabel})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="border border-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-3 py-1 font-mono text-xs font-bold uppercase text-zinc-950 transition cursor-pointer"
          >
            {showDetails ? 'Recolher Tabela' : 'Expandir Tabela Detalhada'}
          </button>
        </div>
      </div>

      {/* CARDS RESUMO DO RESULTADO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Receita Bruta Total */}
        <div className="border border-zinc-300 bg-zinc-50 p-3 space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase text-zinc-500 block">
            (+) Receita Operacional Bruta
          </span>
          <p className="font-mono text-2xl font-black text-zinc-950">
            {fmtBRL(data.totalGrossRevenue)}
          </p>
          <span className="font-mono text-[10px] text-zinc-500 block">
            PDV ({fmtBRL(data.salesGross)}) + OSs ({fmtBRL(data.laborGross + data.partsGross)})
          </span>
        </div>

        {/* Margem de Contribuição */}
        <div className="border border-zinc-300 bg-zinc-50 p-3 space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase text-zinc-500 block">
            (=) Margem Contribuição
          </span>
          <p className="font-mono text-2xl font-black text-zinc-950">
            {fmtBRL(data.grossMargin)}
          </p>
          <span className="font-mono text-[10px] text-zinc-500 block">
            Após dedução de CMV de produtos e peças ({fmtBRL(data.partsCMV)})
          </span>
        </div>

        {/* Custos Operacionais e Despesas */}
        <div className="border border-zinc-300 bg-zinc-50 p-3 space-y-1">
          <span className="font-mono text-[10px] font-bold uppercase text-red-700 block">
            (-) Comissões + Sangrias Caixa
          </span>
          <p className="font-mono text-2xl font-black text-red-900">
            {fmtBRL(data.technicianCommissions + data.cashBleedExpenses)}
          </p>
          <span className="font-mono text-[10px] text-red-700 block">
            Comissões ({fmtBRL(data.technicianCommissions)}) + Sangrias ({fmtBRL(data.cashBleedExpenses)})
          </span>
        </div>

        {/* Lucro Líquido Real */}
        <div
          className={`border-2 p-3 space-y-1 ${
            isProfitPositive
              ? 'border-emerald-700 bg-emerald-50/70'
              : 'border-red-700 bg-red-50/70'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`font-mono text-[10px] font-black uppercase ${
                isProfitPositive ? 'text-emerald-900' : 'text-red-900'
              }`}
            >
              (=) Lucro Líquido Real
            </span>
            <span
              className={`font-mono text-[10px] font-black px-1.5 py-0.2 border ${
                isProfitPositive
                  ? 'border-emerald-700 bg-emerald-700 text-white'
                  : 'border-red-700 bg-red-700 text-white'
              }`}
            >
              Margem: {data.netMarginPct.toFixed(1)}%
            </span>
          </div>
          <p
            className={`font-mono text-2xl font-black ${
              isProfitPositive ? 'text-emerald-950' : 'text-red-950'
            }`}
          >
            {fmtBRL(data.netProfit)}
          </p>
          <span
            className={`font-mono text-[10px] font-bold block ${
              isProfitPositive ? 'text-emerald-800' : 'text-red-800'
            }`}
          >
            {isProfitPositive
              ? 'Resultado positivo após todas as deduções'
              : 'Alerta: despesas superaram receitas no período'}
          </span>
        </div>
      </div>

      {/* TABELA DRE FORMATO OFICIAL ZEBRADA */}
      {showDetails && (
        <div className="border border-zinc-950 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-950 text-white uppercase text-[10px]">
                <th className="p-2.5">Conta / Descritivo Contábil</th>
                <th className="p-2.5 text-center w-28">Ref. Operação</th>
                <th className="p-2.5 text-right w-36">Valor (R$)</th>
                <th className="p-2.5 text-right w-24">Part. %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {/* 1. RECEITA OPERACIONAL BRUTA */}
              <tr className="bg-zinc-100 font-bold">
                <td className="p-2.5 text-zinc-950">1. RECEITA OPERACIONAL BRUTA</td>
                <td className="p-2.5 text-center text-zinc-600">
                  {data.salesCount + data.laborCount} ops
                </td>
                <td className="p-2.5 text-right text-zinc-950 font-black">
                  {fmtBRL(data.totalGrossRevenue)}
                </td>
                <td className="p-2.5 text-right text-zinc-600">100.0%</td>
              </tr>

              {/* Linhas filhas da receita */}
              <tr className="hover:bg-zinc-50">
                <td className="p-2 pl-6 text-zinc-700">
                  <Link href="/admin/vendas" className="hover:underline flex items-center gap-1.5">
                    <span>↳</span> Vendas de Balcão e Acessórios (PDV)
                  </Link>
                </td>
                <td className="p-2 text-center text-zinc-500">{data.salesCount} vendas</td>
                <td className="p-2 text-right text-zinc-800">{fmtBRL(data.salesGross)}</td>
                <td className="p-2 text-right text-zinc-500">
                  {data.totalGrossRevenue > 0
                    ? `${((data.salesGross / data.totalGrossRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                </td>
              </tr>

              <tr className="hover:bg-zinc-50">
                <td className="p-2 pl-6 text-zinc-700">
                  <Link href="/admin/os" className="hover:underline flex items-center gap-1.5">
                    <span>↳</span> Serviços e Mão de Obra de OS Concluídas
                  </Link>
                </td>
                <td className="p-2 text-center text-zinc-500">{data.laborCount} OSs</td>
                <td className="p-2 text-right text-zinc-800">{fmtBRL(data.laborGross)}</td>
                <td className="p-2 text-right text-zinc-500">
                  {data.totalGrossRevenue > 0
                    ? `${((data.laborGross / data.totalGrossRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                </td>
              </tr>

              <tr className="hover:bg-zinc-50">
                <td className="p-2 pl-6 text-zinc-700">
                  <Link href="/admin/pecas" className="hover:underline flex items-center gap-1.5">
                    <span>↳</span> Peças e Componentes Repassados na OS
                  </Link>
                </td>
                <td className="p-2 text-center text-zinc-500">{data.partsCount} peças</td>
                <td className="p-2 text-right text-zinc-800">{fmtBRL(data.partsGross)}</td>
                <td className="p-2 text-right text-zinc-500">
                  {data.totalGrossRevenue > 0
                    ? `${((data.partsGross / data.totalGrossRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                </td>
              </tr>

              {/* 2. CUSTO DAS MERCADORIAS E PEÇAS (CMV) */}
              <tr className="bg-zinc-50 font-bold text-red-900">
                <td className="p-2.5">2. (-) CUSTO VARIÁVEL / CMV (PRODUTOS PDV + PEÇAS OS)</td>
                <td className="p-2.5 text-center text-red-700">CMV Real</td>
                <td className="p-2.5 text-right font-black">- {fmtBRL(data.partsCMV)}</td>
                <td className="p-2.5 text-right text-red-700">
                  {data.totalGrossRevenue > 0
                    ? `-${((data.partsCMV / data.totalGrossRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                </td>
              </tr>

              {/* 3. MARGEM DE CONTRIBUIÇÃO BRUTA */}
              <tr className="bg-zinc-100 font-bold border-t-2 border-zinc-950">
                <td className="p-2.5 text-zinc-950">3. (=) MARGEM DE CONTRIBUIÇÃO OPERACIONAL</td>
                <td className="p-2.5 text-center text-zinc-500">—</td>
                <td className="p-2.5 text-right text-zinc-950 font-black">
                  {fmtBRL(data.grossMargin)}
                </td>
                <td className="p-2.5 text-right text-zinc-950">
                  {data.totalGrossRevenue > 0
                    ? `${((data.grossMargin / data.totalGrossRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                </td>
              </tr>

              {/* 4. DEDUÇÕES OPERACIONAIS: COMISSÕES */}
              <tr className="hover:bg-zinc-50 text-red-900">
                <td className="p-2 pl-6">
                  <Link href="/admin/comissoes" className="hover:underline flex items-center gap-1.5">
                    <span>↳</span> 4.1 (-) Comissões Técnicas Apuradas (Livro de Comissões)
                  </Link>
                </td>
                <td className="p-2 text-center text-zinc-500">Rateio Real</td>
                <td className="p-2 text-right font-bold">- {fmtBRL(data.technicianCommissions)}</td>
                <td className="p-2 text-right text-red-700">
                  {data.totalGrossRevenue > 0
                    ? `-${((data.technicianCommissions / data.totalGrossRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                </td>
              </tr>

              {/* 5. DEDUÇÕES OPERACIONAIS: SANGRIAS E DESPESAS DE CAIXA */}
              <tr className="hover:bg-zinc-50 text-red-900">
                <td className="p-2 pl-6">
                  <Link href="/admin/caixa" className="hover:underline flex items-center gap-1.5">
                    <span>↳</span> 4.2 (-) Despesas Operacionais / Sangrias do Caixa
                  </Link>
                </td>
                <td className="p-2 text-center text-zinc-500">{data.cashBleedCount} sangrias</td>
                <td className="p-2 text-right font-bold">- {fmtBRL(data.cashBleedExpenses)}</td>
                <td className="p-2 text-right text-red-700">
                  {data.totalGrossRevenue > 0
                    ? `-${((data.cashBleedExpenses / data.totalGrossRevenue) * 100).toFixed(1)}%`
                    : '0%'}
                </td>
              </tr>

              {/* 6. LUCRO LÍQUIDO REAL */}
              <tr
                className={`font-black text-sm border-t-2 border-b-2 border-zinc-950 ${
                  isProfitPositive
                    ? 'bg-emerald-100 text-emerald-950'
                    : 'bg-red-100 text-red-950'
                }`}
              >
                <td className="p-3">5. (=) RESULTADO LÍQUIDO REAL DO PERÍODO</td>
                <td className="p-3 text-center">
                  {isProfitPositive ? 'LUCRO' : 'PREJUÍZO'}
                </td>
                <td className="p-3 text-right text-base font-black">
                  {fmtBRL(data.netProfit)}
                </td>
                <td className="p-3 text-right">
                  {data.netMarginPct.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* RODA PÉ INFORMATIVO */}
      <div className="flex flex-wrap items-center justify-between text-[11px] font-mono text-zinc-500 pt-1">
        <span>
          💡 Cálculo em conformidade com o CMV real (PDV + OS), livro de comissões (Iago 30% / Jefferson 50% / Loja 0%) e sangrias do caixa.
        </span>
        <Link
          href="/admin/comissoes"
          className="text-zinc-950 font-bold underline hover:text-emerald-700"
        >
          Auditar fechamento de comissões →
        </Link>
      </div>
    </section>
  );
}
