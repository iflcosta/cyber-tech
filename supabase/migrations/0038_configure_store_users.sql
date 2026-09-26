-- ============================================================
-- 0038_configure_store_users.sql — Setup Completo de Usuários e Comissões
-- ============================================================
-- Papéis e Regras de Negócio:
-- 1. FELIPE (felipe@cyberinformatica.tech) — Dono / Administrador:
--    - role: 'owner' | commission_rate: 0.00 | can_delete: true
--    - Retém lucro da loja, acesso financeiro global.
--
-- 2. IAGO (iago@cyberinformatica.tech / iagopuma0) — Hardware Tech & Dev Master:
--    - role: 'owner' | commission_rate: 0.30 | can_delete: true
--    - 30% de comissão em hardware, autoridade técnica e dev master.
--
-- 3. JEFFERSON (jefferson@cyberinformatica.tech) — Técnico Mezanino:
--    - role: 'technician' | commission_rate: 0.50 | can_delete: false
--    - 50/50 em celulares, telas OCA e placas de vídeo.
--
-- 4. EDUARDO (eduardo@cyberinformatica.tech) — Estagiário de Balcão & Estoque:
--    - role: 'technician' | commission_rate: 0.00 | can_delete: false
--    - Mesmos acessos operacionais (OS, Estoque, Vendas, Peças), sem comissão.
-- ============================================================

-- 1. Garante que o gatilho de proteção permita operações de administração via SQL Editor (auth.uid() IS NULL)
CREATE OR REPLACE FUNCTION public.profiles_block_self_role_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se executado no SQL Editor do Supabase ou service_role (sem JWT de usuário final)
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  -- Se for um usuário final logado tentando alterar seu próprio papel
  IF NOT public.is_owner() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Nao pode alterar proprio role (precisa de owner)';
    END IF;
    IF NEW.active IS DISTINCT FROM OLD.active THEN
      RAISE EXCEPTION 'Nao pode alterar proprio active (precisa de owner)';
    END IF;
  END IF;

  IF NEW.can_delete IS DISTINCT FROM OLD.can_delete THEN
    IF NOT public.can_delete() THEN
      RAISE EXCEPTION 'Nao pode alterar can_delete (precisa ja ter permissao de exclusao)';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2. Garante que as colunas necessárias existam em profiles (100% aditivo)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS commission_rate numeric(4,2) NOT NULL DEFAULT 0.00;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS can_delete boolean NOT NULL DEFAULT false;

-- 3. Garante que technician_id exista em service_orders
ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS technician_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. Garante que a tabela commission_ledger exista
CREATE TABLE IF NOT EXISTS public.commission_ledger (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_order_id    uuid NOT NULL REFERENCES public.service_orders(id) ON DELETE CASCADE,
  technician_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  technician_name     text NOT NULL,
  labor_amount        numeric(10,2) NOT NULL DEFAULT 0.00,
  commission_rate     numeric(4,2) NOT NULL DEFAULT 0.00,
  commission_amount   numeric(10,2) NOT NULL DEFAULT 0.00,
  os_payment_status   text NOT NULL DEFAULT 'pending',
  status              text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid_out')),
  payout_date         timestamptz,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_order_id, technician_id)
);

ALTER TABLE public.commission_ledger ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'commission_ledger' AND policyname = 'commission_ledger_select_staff'
  ) THEN
    CREATE POLICY commission_ledger_select_staff ON public.commission_ledger FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'commission_ledger' AND policyname = 'commission_ledger_all_owner'
  ) THEN
    CREATE POLICY commission_ledger_all_owner ON public.commission_ledger FOR ALL TO authenticated USING ((SELECT public.is_owner())) WITH CHECK ((SELECT public.is_owner()));
  END IF;
END $$;

GRANT ALL ON public.commission_ledger TO anon, authenticated, service_role;

-- 5. Sincroniza e insere todos os 4 usuários de auth.users para public.profiles
INSERT INTO public.profiles (id, full_name, email, role, commission_rate, can_delete, active)
SELECT 
  u.id,
  CASE 
    WHEN lower(u.email) LIKE '%felipe%' THEN 'Felipe'
    WHEN lower(u.email) LIKE '%iago%' THEN 'Iago'
    WHEN lower(u.email) LIKE '%jefferson%' THEN 'Jefferson'
    WHEN lower(u.email) LIKE '%eduardo%' THEN 'Eduardo'
    ELSE split_part(u.email, '@', 1)
  END AS full_name,
  u.email,
  CASE 
    WHEN lower(u.email) LIKE '%felipe%' OR lower(u.email) LIKE '%iago%' THEN 'owner'
    ELSE 'technician'
  END AS role,
  CASE 
    WHEN lower(u.email) LIKE '%jefferson%' THEN 0.50
    WHEN lower(u.email) LIKE '%iago%' THEN 0.30
    ELSE 0.00
  END AS commission_rate,
  CASE 
    WHEN lower(u.email) LIKE '%felipe%' OR lower(u.email) LIKE '%iago%' THEN true
    ELSE false
  END AS can_delete,
  true AS active
FROM auth.users u
WHERE lower(u.email) IN (
  'felipe@cyberinformatica.tech',
  'iago@cyberinformatica.tech',
  'jefferson@cyberinformatica.tech',
  'eduardo@cyberinformatica.tech'
) OR lower(u.email) LIKE '%iago%'
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  commission_rate = EXCLUDED.commission_rate,
  can_delete = EXCLUDED.can_delete,
  active = EXCLUDED.active;

-- 6. Atualização cirúrgica estrita para os 4 membros da equipe
UPDATE public.profiles
SET full_name = 'Felipe', role = 'owner', commission_rate = 0.00, can_delete = true, active = true
WHERE lower(email) = 'felipe@cyberinformatica.tech';

UPDATE public.profiles
SET full_name = 'Iago', role = 'owner', commission_rate = 0.30, can_delete = true, active = true
WHERE lower(email) = 'iago@cyberinformatica.tech' OR lower(email) LIKE '%iago%';

UPDATE public.profiles
SET full_name = 'Jefferson', role = 'technician', commission_rate = 0.50, can_delete = false, active = true
WHERE lower(email) = 'jefferson@cyberinformatica.tech';

UPDATE public.profiles
SET full_name = 'Eduardo', role = 'technician', commission_rate = 0.00, can_delete = false, active = true
WHERE lower(email) = 'eduardo@cyberinformatica.tech';

-- 7. Notifica o PostgREST para recarregar o schema
NOTIFY pgrst, 'reload schema';

-- 8. Retorna os 4 perfis configurados para confirmação visual imediata
SELECT id, full_name, email, role, commission_rate, can_delete, active 
FROM public.profiles
WHERE lower(email) IN (
  'felipe@cyberinformatica.tech',
  'iago@cyberinformatica.tech',
  'jefferson@cyberinformatica.tech',
  'eduardo@cyberinformatica.tech'
) OR lower(email) LIKE '%iago%';
