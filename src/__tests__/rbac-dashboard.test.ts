import { describe, it, expect } from 'vitest';
import { resolveUserContext } from '@/app/admin/lib/rbac';

describe('RBAC & Permissões do Dashboard — Cyber Informática V2', () => {
  it('Felipe (Dono): tem visão total de faturamento, lucro retido e todas as comissões', () => {
    const user = { id: 'user-felipe', email: 'felipe@cyberinformatica.tech' };
    const profile = { full_name: 'Felipe Dono', role: 'owner', can_delete: true };

    const ctx = resolveUserContext(user, profile);

    expect(ctx.realRole).toBe('owner');
    expect(ctx.effectiveRole).toBe('owner');
    expect(ctx.canViewStoreFinancials).toBe(true);
    expect(ctx.canViewAllCommissions).toBe(true);
    expect(ctx.canViewSupplierCosts).toBe(true);
    expect(ctx.canViewSalesFinancials).toBe(true);
    expect(ctx.canDeleteRecords).toBe(true);
  });

  it('Iago (Técnico de Hardware em modo estrito): vê apenas suas próprias comissões (30%) e vendas PDV', () => {
    const user = { id: 'user-iago', email: 'iago@cyberinformatica.tech' };
    const profile = { full_name: 'Iago Técnico', role: 'technician', can_delete: false };

    // Simulando visão estrita de técnico
    const ctx = resolveUserContext(user, profile, 'hardware_tech');

    expect(ctx.effectiveRole).toBe('hardware_tech');
    expect(ctx.canViewStoreFinancials).toBe(false); // NÃO vê lucro global da loja
    expect(ctx.canViewAllCommissions).toBe(false);   // NÃO vê comissões do Jefferson
    expect(ctx.canViewOwnCommissions).toBe(true);    // VÊ seus 30%
    expect(ctx.canViewSalesFinancials).toBe(true);   // Vê vendas de balcão
    expect(ctx.facilityFocus).toBe('terreo');
  });

  it('Jefferson (Especialista Mezanino): vê apenas suas comissões de telas/BGA (50%)', () => {
    const user = { id: 'user-jefferson', email: 'jefferson@cyberinformatica.tech' };
    const profile = { full_name: 'Jefferson Mezanino', role: 'technician', can_delete: false };

    const ctx = resolveUserContext(user, profile);

    expect(ctx.effectiveRole).toBe('mezanino_specialist');
    expect(ctx.canViewStoreFinancials).toBe(false); // NÃO vê faturamento da loja
    expect(ctx.canViewAllCommissions).toBe(false);   // NÃO vê comissões do Iago
    expect(ctx.canViewOwnCommissions).toBe(true);    // VÊ seus 50%
    expect(ctx.canViewSalesFinancials).toBe(false);  // Foco exclusivo no mezanino
    expect(ctx.facilityFocus).toBe('mezanino');
  });

  it('Eduardo (Estagiário de Estoque): ZERO dados financeiros ou comissões, foco total na estante 6m', () => {
    const user = { id: 'user-eduardo', email: 'eduardo@cyberinformatica.tech' };
    const profile = { full_name: 'Eduardo Estoque', role: 'technician', can_delete: false };

    const ctx = resolveUserContext(user, profile);

    expect(ctx.effectiveRole).toBe('stock_intern');
    expect(ctx.canViewStoreFinancials).toBe(false); // ZERO acesso a faturamento
    expect(ctx.canViewAllCommissions).toBe(false);   // ZERO acesso a comissões
    expect(ctx.canViewOwnCommissions).toBe(false);
    expect(ctx.canViewSalesFinancials).toBe(false); // Não vê valores em R$
    expect(ctx.canManageStock).toBe(true);          // Acesso total a peças e catálogo
    expect(ctx.facilityFocus).toBe('estoque');
  });

  it('Iago como Desenvolvedor Master: acesso total e capacidade de alternar simulações', () => {
    const user = { id: 'user-iago', email: 'iagopuma0@gmail.com' };
    const profile = { full_name: 'Iago Dev', role: 'technician', can_delete: true };

    // Sem simulação (Master)
    const masterCtx = resolveUserContext(user, profile);
    expect(masterCtx.isDeveloper).toBe(true);
    expect(masterCtx.canViewStoreFinancials).toBe(true);
    expect(masterCtx.canViewAllCommissions).toBe(true);

    // Simulando visão do Eduardo
    const simEduardo = resolveUserContext(user, profile, 'stock_intern');
    expect(simEduardo.isSimulating).toBe(true);
    expect(simEduardo.effectiveRole).toBe('stock_intern');
    expect(simEduardo.canViewStoreFinancials).toBe(false);
  });
});
