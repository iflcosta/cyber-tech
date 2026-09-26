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

  it('Eduardo (Estagiário de Estoque & Balcão): mesmos acessos operacionais (OS, estoque, vendas), mas ZERO comissões', () => {
    const user = { id: 'user-eduardo', email: 'eduardo@cyberinformatica.tech' };
    const profile = { full_name: 'Eduardo Estoque', role: 'technician', can_delete: false };

    const ctx = resolveUserContext(user, profile);

    expect(ctx.effectiveRole).toBe('stock_intern');
    expect(ctx.canViewStoreFinancials).toBe(false); // ZERO acesso a faturamento/lucro global da loja
    expect(ctx.canViewAllCommissions).toBe(false);   // ZERO acesso a comissões gerais
    expect(ctx.canViewOwnCommissions).toBe(false);   // Estagiário não remunerado: zero comissões
    expect(ctx.canViewSalesFinancials).toBe(true);   // Acesso liberado a vendas/balcão
    expect(ctx.canManageStock).toBe(true);          // Acesso total a peças e catálogo
    expect(ctx.canManageOS).toBe(true);             // Acesso total a ordens de serviço
    expect(ctx.facilityFocus).toBe('all');
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

  it('Contas Corporativas Oficiais (@cyberinformatica.tech): resolução automática de papéis', () => {
    // 1. Felipe (Dono)
    const felipeCtx = resolveUserContext(
      { id: 'usr-felipe', email: 'felipe@cyberinformatica.tech' },
      { full_name: 'Felipe', role: 'owner', can_delete: true }
    );
    expect(felipeCtx.effectiveRole).toBe('owner');
    expect(felipeCtx.canViewStoreFinancials).toBe(true);
    expect(felipeCtx.canViewAllCommissions).toBe(true);

    // 2. Jefferson (Técnico Mezanino)
    const jeffCtx = resolveUserContext(
      { id: 'usr-jefferson', email: 'jefferson@cyberinformatica.tech' },
      { full_name: 'Jefferson', role: 'technician', can_delete: false }
    );
    expect(jeffCtx.effectiveRole).toBe('mezanino_specialist');
    expect(jeffCtx.canViewOwnCommissions).toBe(true);
    expect(jeffCtx.canViewStoreFinancials).toBe(false);

    // 3. Eduardo (Estagiário Não Remunerado)
    const eduardoCtx = resolveUserContext(
      { id: 'usr-eduardo', email: 'eduardo@cyberinformatica.tech' },
      { full_name: 'Eduardo', role: 'technician', can_delete: false }
    );
    expect(eduardoCtx.effectiveRole).toBe('stock_intern');
    expect(eduardoCtx.canViewOwnCommissions).toBe(false); // Sem comissão
    expect(eduardoCtx.canViewAllCommissions).toBe(false); // Sem comissão
    expect(eduardoCtx.canViewStoreFinancials).toBe(false); // Sem financeiro global
    expect(eduardoCtx.canManageOS).toBe(true);             // Mesmo acesso operacional
    expect(eduardoCtx.canManageStock).toBe(true);          // Mesmo acesso operacional
    expect(eduardoCtx.canViewSalesFinancials).toBe(true);  // Balcão/PDV liberado
  });
});
