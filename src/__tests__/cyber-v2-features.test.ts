import { describe, it, expect } from 'vitest';

describe('Cyber V2 — Regras de Comissões por Técnico', () => {
  function computeCommission(laborCost: number, tech: 'iago' | 'jefferson' | 'felipe') {
    switch (tech) {
      case 'iago':
        return laborCost * 0.30;
      case 'jefferson':
        return laborCost * 0.50; // Modelo 50/50 com a loja/Felipe
      case 'felipe':
      default:
        return 0.00; // 100% retido na loja
    }
  }

  it('calcula 30% para Iago nas OS executadas por ele', () => {
    expect(computeCommission(200, 'iago')).toBe(60);
    expect(computeCommission(450, 'iago')).toBe(135);
  });

  it('calcula 50% para Jefferson (modelo 50/50 com Felipe)', () => {
    expect(computeCommission(300, 'jefferson')).toBe(150);
    expect(computeCommission(800, 'jefferson')).toBe(400);
  });

  it('retém 100% na loja para OS do Felipe ou sem técnico externo', () => {
    expect(computeCommission(300, 'felipe')).toBe(0);
  });
});

describe('Cyber V2 — Portal do Cliente & Stepper Pericial', () => {
  function getStepIndex(status: string): number {
    switch (status) {
      case 'awaiting_approval':
        return 2;
      case 'approved':
      case 'waiting_part':
      case 'in_progress':
        return 3;
      case 'ready':
        return 4;
      case 'delivered':
        return 5;
      default:
        return 1;
    }
  }

  it('mapeia corretamente os 5 estágios da bancada', () => {
    expect(getStepIndex('created')).toBe(1); // Triagem
    expect(getStepIndex('awaiting_approval')).toBe(2); // Laudo / Orçamento
    expect(getStepIndex('in_progress')).toBe(3); // Em Bancada
    expect(getStepIndex('waiting_part')).toBe(3); // Aguardando Peça (Bancada)
    expect(getStepIndex('ready')).toBe(4); // Testes QA concluídos / Pronto
    expect(getStepIndex('delivered')).toBe(5); // Entregue com Garantia CDC
  });

  it('higieniza o nome do cliente para LGPD no rastreio público', () => {
    function sanitizeCustomerName(fullName: string) {
      const parts = fullName.trim().split(/\s+/);
      return parts[0] || 'Cliente';
    }

    expect(sanitizeCustomerName('Carlos Eduardo da Silva')).toBe('Carlos');
    expect(sanitizeCustomerName('Mariana Ferreira')).toBe('Mariana');
    expect(sanitizeCustomerName('')).toBe('Cliente');
  });
});
