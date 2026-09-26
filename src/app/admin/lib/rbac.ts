/**
 * RBAC (Role-Based Access Control) & Contexto Operacional — Cyber Informática V2
 *
 * Estrutura de papéis no negócio real:
 * 1. FELIPE (Dono / Administrador):
 *    - Visão consolidada: Faturamento total, lucro operacional líquido retido na loja,
 *      comissões de todos os técnicos (Iago 30% + Jefferson 50%), gastos com fornecedores
 *      e controle gerencial total.
 *
 * 2. IAGO (Técnico de Hardware & Balcão / Desenvolvedor):
 *    - Como desenvolvedor: Superuser com acesso irrestrito para testes e desenvolvimento,
 *      incluindo seletor de simulação de papéis.
 *    - Como técnico: Gestão de bancada de PCs/Workstations, vendas de balcão e visualização
 *      exclusiva de suas próprias comissões (30%). Não vê lucro global nem comissões do Jefferson.
 *
 * 3. JEFFERSON (Especialista Mezanino / Microeletrônica & Telas OCA):
 *    - Foco exclusivo no Mezanino: Telas em autoclave industrial 6.0 Bar, reparo de placas de vídeo (BGA),
 *      e visualização de sua comissão pessoal (50/50). Não vê vendas gerais de balcão nem faturamento global.
 *
 * 4. EDUARDO (Estagiário de Estoque & Balcão):
 *    - Foco 100% físico e operacional: Gestão do catálogo da estante de 6m (stock_items),
 *      reposição de estoque mínimo, bipagem rápida no PDV e check-in básico de OS.
 *    - Zero dados financeiros: Não tem acesso a faturamento em R$, margens ou comissões.
 */

export type OperationalRole = 'owner' | 'hardware_tech' | 'mezanino_specialist' | 'stock_intern';

export interface UserContext {
  userId: string;
  email: string;
  name: string;
  realRole: OperationalRole;
  effectiveRole: OperationalRole;
  isSimulating: boolean;
  isDeveloper: boolean;

  // Permissões granulares de visualização
  canViewStoreFinancials: boolean; // Faturamento total, margem e lucro retido da loja
  canViewAllCommissions: boolean;  // Extrato de comissões de todos os colaboradores
  canViewOwnCommissions: boolean;  // Extrato de sua própria comissão
  canViewSupplierCosts: boolean;   // Custos de peças com fornecedores
  canViewSalesFinancials: boolean; // Valores monetários em vendas PDV
  canManageStock: boolean;         // Acesso completo ao estoque físico
  canManageOS: boolean;            // Acesso à bancada de OS
  canDeleteRecords: boolean;       // Permissão crítica de exclusão (can_delete)
  
  // Nível da loja prioritário
  facilityFocus: 'all' | 'terreo' | 'mezanino' | 'estoque';
}

export function resolveUserContext(
  user: { id: string; email?: string } | null,
  profile: { full_name?: string | null; role?: string | null; can_delete?: boolean } | null,
  simulatedRole?: string | null
): UserContext {
  const userId = user?.id || '';
  const email = (user?.email || '').toLowerCase().trim();
  const name = (profile?.full_name || '').toLowerCase().trim();
  const dbRole = (profile?.role || '').toLowerCase().trim();

  // 1. Identificação do papel real baseado nos dados da loja
  let realRole: OperationalRole = 'hardware_tech';

  const isFelipe = name.includes('felipe') || email.includes('felipe') || dbRole === 'owner';
  const isIago = name.includes('iago') || email.includes('iago') || email.includes('iagopuma0');
  const isJefferson = name.includes('jefferson') || email.includes('jefferson');
  const isEduardo = name.includes('eduardo') || email.includes('eduardo');

  if (isFelipe) {
    realRole = 'owner';
  } else if (isJefferson) {
    realRole = 'mezanino_specialist';
  } else if (isEduardo) {
    realRole = 'stock_intern';
  } else {
    realRole = 'hardware_tech';
  }

  // O Iago é o Arquiteto/Desenvolvedor do sistema com acesso irrestrito de auditoria/dev
  const isDeveloper = isIago || email.includes('iagopuma0') || email.includes('dev@cyberinformatica.tech');

  // 2. Simulação de papéis (para o desenvolvedor testar a interface de cada membro da equipe)
  let effectiveRole = realRole;
  let isSimulating = false;

  if (isDeveloper && simulatedRole) {
    if (['owner', 'hardware_tech', 'mezanino_specialist', 'stock_intern'].includes(simulatedRole)) {
      effectiveRole = simulatedRole as OperationalRole;
      isSimulating = true;
    }
  }

  // 3. Matriz de permissões derivada do papel efetivo
  const canDeleteRecords = Boolean(profile?.can_delete || (isFelipe && !isSimulating));

  let canViewStoreFinancials = false;
  let canViewAllCommissions = false;
  let canViewOwnCommissions = false;
  let canViewSupplierCosts = false;
  let canViewSalesFinancials = false;
  let facilityFocus: 'all' | 'terreo' | 'mezanino' | 'estoque' = 'all';

  switch (effectiveRole) {
    case 'owner':
      canViewStoreFinancials = true;
      canViewAllCommissions = true;
      canViewOwnCommissions = false; // O dono retém o lucro da loja, não recebe comissão
      canViewSupplierCosts = true;
      canViewSalesFinancials = true;
      facilityFocus = 'all';
      break;

    case 'hardware_tech':
      canViewStoreFinancials = false;
      canViewAllCommissions = false;
      canViewOwnCommissions = true;  // Iago vê seus 30% de comissão
      canViewSupplierCosts = false;
      canViewSalesFinancials = true; // Vendas de balcão no térreo
      facilityFocus = 'terreo';
      break;

    case 'mezanino_specialist':
      canViewStoreFinancials = false;
      canViewAllCommissions = false;
      canViewOwnCommissions = true;  // Jefferson vê seus 50% de comissão
      canViewSupplierCosts = false;
      canViewSalesFinancials = false; // Mezanino foca estritamente em serviços
      facilityFocus = 'mezanino';
      break;

    case 'stock_intern':
      canViewStoreFinancials = false;
      canViewAllCommissions = false;
      canViewOwnCommissions = false;
      canViewSupplierCosts = false;
      canViewSalesFinancials = false; // Eduardo foca em contagem de estoque, não em valores de faturamento
      facilityFocus = 'estoque';
      break;
  }

  // Em modo desenvolvedor puro (sem simulação ativa), Iago mantém acesso total
  if (isDeveloper && !isSimulating) {
    canViewStoreFinancials = true;
    canViewAllCommissions = true;
    canViewOwnCommissions = true;
    canViewSupplierCosts = true;
    canViewSalesFinancials = true;
    facilityFocus = 'all';
  }

  return {
    userId,
    email: user?.email || '',
    name: profile?.full_name || (isFelipe ? 'Felipe' : isIago ? 'Iago' : isJefferson ? 'Jefferson' : isEduardo ? 'Eduardo' : 'Operador'),
    realRole,
    effectiveRole,
    isSimulating,
    isDeveloper,
    canViewStoreFinancials,
    canViewAllCommissions,
    canViewOwnCommissions,
    canViewSupplierCosts,
    canViewSalesFinancials,
    canManageStock: true,
    canManageOS: true,
    canDeleteRecords,
    facilityFocus,
  };
}
