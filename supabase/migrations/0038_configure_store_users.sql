-- ============================================================
-- 0038_configure_store_users.sql — Configuração de Usuários e Perfis
-- ============================================================
-- Papéis e Regras de Negócio:
-- 1. FELIPE (felipe@cyberinformatica.tech) — Dono / Administrador:
--    - role: 'owner'
--    - commission_rate: 0.00 (Lucro retido na loja)
--    - can_delete: true
--    - Visão de faturamento global, margens e todas as comissões.
--
-- 2. JEFFERSON (jefferson@cyberinformatica.tech) — Técnico Mezanino:
--    - role: 'technician'
--    - commission_rate: 0.50 (50/50 em celulares, vidros e placas de vídeo)
--    - can_delete: false
--    - Acesso total à bancada de OS, estoque, vendas e suas comissões (50%).
--
-- 3. EDUARDO (eduardo@cyberinformatica.tech) — Estagiário de Balcão & Estoque:
--    - role: 'technician'
--    - commission_rate: 0.00 (Estagiário não remunerado / sem comissão)
--    - can_delete: false
--    - Mesmos acessos operacionais (OS, Estoque, Vendas, Peças, Fornecedores),
--      mas SEM exibição ou cálculo de comissões.
-- ============================================================

-- 1. Garante que os usuários existentes no auth.users tenham registros em public.profiles
INSERT INTO public.profiles (id, full_name, email, role, commission_rate, can_delete, active)
SELECT 
  u.id,
  CASE 
    WHEN lower(u.email) LIKE '%felipe%' THEN 'Felipe'
    WHEN lower(u.email) LIKE '%jefferson%' THEN 'Jefferson'
    WHEN lower(u.email) LIKE '%eduardo%' THEN 'Eduardo'
    ELSE split_part(u.email, '@', 1)
  END AS full_name,
  u.email,
  CASE 
    WHEN lower(u.email) LIKE '%felipe%' THEN 'owner'
    ELSE 'technician'
  END AS role,
  CASE 
    WHEN lower(u.email) LIKE '%jefferson%' THEN 0.50
    WHEN lower(u.email) LIKE '%iago%' THEN 0.30
    ELSE 0.00
  END AS commission_rate,
  CASE 
    WHEN lower(u.email) LIKE '%felipe%' THEN true
    ELSE false
  END AS can_delete,
  true AS active
FROM auth.users u
WHERE lower(u.email) IN (
  'felipe@cyberinformatica.tech',
  'jefferson@cyberinformatica.tech',
  'eduardo@cyberinformatica.tech'
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  commission_rate = EXCLUDED.commission_rate,
  can_delete = EXCLUDED.can_delete,
  active = EXCLUDED.active;

-- 2. Atualiza por e-mail caso o id já estivesse presente com valores antigos
UPDATE public.profiles
SET 
  full_name = 'Felipe',
  role = 'owner',
  commission_rate = 0.00,
  can_delete = true,
  active = true
WHERE lower(email) = 'felipe@cyberinformatica.tech' OR lower(email) LIKE '%felipe%';

UPDATE public.profiles
SET 
  full_name = 'Jefferson',
  role = 'technician',
  commission_rate = 0.50,
  can_delete = false,
  active = true
WHERE lower(email) = 'jefferson@cyberinformatica.tech' OR lower(email) LIKE '%jefferson%';

UPDATE public.profiles
SET 
  full_name = 'Eduardo',
  role = 'technician',
  commission_rate = 0.00,
  can_delete = false,
  active = true
WHERE lower(email) = 'eduardo@cyberinformatica.tech' OR lower(email) LIKE '%eduardo%';

-- 3. Atualiza também a taxa do Iago para 30% caso o perfil exista
UPDATE public.profiles
SET 
  commission_rate = 0.30
WHERE lower(email) LIKE '%iago%' OR lower(full_name) LIKE '%iago%';

-- 4. Confirmação do resultado
SELECT id, full_name, email, role, commission_rate, can_delete, active 
FROM public.profiles
WHERE lower(email) IN (
  'felipe@cyberinformatica.tech',
  'jefferson@cyberinformatica.tech',
  'eduardo@cyberinformatica.tech'
) OR lower(email) LIKE '%iago%';
