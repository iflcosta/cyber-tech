import { describe, it, expect } from 'vitest';

export function calculateCommission(
  laborCost: number,
  technicianName: string,
  customRate?: number
): { rate: number; amount: number; storeRetained: number } {
  const nameLower = (technicianName || '').toLowerCase();
  let rate = 0.00;

  if (nameLower.includes('iago')) {
    rate = 0.30; // 30% Mão de obra
  } else if (nameLower.includes('jefferson')) {
    rate = 0.50; // 50/50 Mezanino, OCA, Celulares e GPU
  } else if (nameLower.includes('felipe')) {
    rate = 0.00; // 100% Retido na loja
  } else if (customRate !== undefined && customRate !== null) {
    rate = customRate;
  }

  const labor = Math.max(0, Number(laborCost) || 0);
  const amount = Math.round(labor * rate * 100) / 100;
  const storeRetained = Math.round((labor - amount) * 100) / 100;

  return { rate, amount, storeRetained };
}

export function filterByFortnight<T extends { date: string | Date }>(
  items: T[],
  year: number,
  month: number, // 1-12
  fortnight: '1' | '2' | 'all'
): T[] {
  return items.filter((item) => {
    const d = new Date(item.date);
    if (d.getFullYear() !== year || d.getMonth() + 1 !== month) return false;
    const day = d.getDate();
    if (fortnight === '1') return day >= 1 && day <= 15;
    if (fortnight === '2') return day >= 16;
    return true;
  });
}

describe('Módulo de Comissões — Regras Oficiais Cyber Informática', () => {
  it('aplica exatamente 30% de comissão para Iago sobre a mão de obra', () => {
    const res1 = calculateCommission(150.00, 'Iago Costa');
    expect(res1.rate).toBe(0.30);
    expect(res1.amount).toBe(45.00);
    expect(res1.storeRetained).toBe(105.00);

    const res2 = calculateCommission(380.00, 'Iago');
    expect(res2.amount).toBe(114.00);
    expect(res2.storeRetained).toBe(266.00);
  });

  it('aplica o modelo 50/50 de partilha de lucro com Felipe para Jefferson', () => {
    const res1 = calculateCommission(300.00, 'Jefferson Mezanino');
    expect(res1.rate).toBe(0.50);
    expect(res1.amount).toBe(150.00);
    expect(res1.storeRetained).toBe(150.00);

    const res2 = calculateCommission(750.00, 'Jefferson Telas OCA');
    expect(res2.amount).toBe(375.00);
    expect(res2.storeRetained).toBe(375.00);
  });

  it('retém 100% da mão de obra na loja para OS executada por Felipe ou sem técnico externo', () => {
    const res1 = calculateCommission(500.00, 'Felipe');
    expect(res1.rate).toBe(0.00);
    expect(res1.amount).toBe(0.00);
    expect(res1.storeRetained).toBe(500.00);

    const res2 = calculateCommission(200.00, 'Loja / Geral');
    expect(res2.rate).toBe(0.00);
    expect(res2.amount).toBe(0.00);
    expect(res2.storeRetained).toBe(200.00);
  });

  it('garante que comissão incide estritamente sobre a mão de obra, NUNCA sobre peças', () => {
    const laborCost = 200.00;
    const partsCost = 450.00; // SSD + Cabo + Memória do estoque do Eduardo
    const totalOS = laborCost + partsCost;

    const commissionIago = calculateCommission(laborCost, 'Iago');
    expect(commissionIago.amount).toBe(60.00); // 30% de 200, NUNCA de 650
    expect(commissionIago.amount).not.toBe(totalOS * 0.30);

    const commissionJeff = calculateCommission(laborCost, 'Jefferson');
    expect(commissionJeff.amount).toBe(100.00); // 50% de 200
  });

  it('separa corretamente os períodos do extrato quinzenal', () => {
    const items = [
      { id: '1', date: '2026-09-05T10:00:00Z', amount: 100 },
      { id: '2', date: '2026-09-15T18:00:00Z', amount: 150 },
      { id: '3', date: '2026-09-16T09:00:00Z', amount: 200 },
      { id: '4', date: '2026-09-28T14:00:00Z', amount: 300 },
      { id: '5', date: '2026-08-10T12:00:00Z', amount: 50 },
    ];

    const q1 = filterByFortnight(items, 2026, 9, '1');
    expect(q1.map((i) => i.id)).toEqual(['1', '2']);

    const q2 = filterByFortnight(items, 2026, 9, '2');
    expect(q2.map((i) => i.id)).toEqual(['3', '4']);

    const allMonth = filterByFortnight(items, 2026, 9, 'all');
    expect(allMonth.map((i) => i.id)).toEqual(['1', '2', '3', '4']);
  });
});
