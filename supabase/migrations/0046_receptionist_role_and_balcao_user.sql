-- =============================================================================
-- 0046_receptionist_role_and_balcao_user.sql
-- Papel de Atendimento de Balcão (receptionist) e regras de permissão
-- =============================================================================

-- 1. Amplia o CHECK constraint da tabela profiles para permitir 'receptionist'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'technician', 'receptionist'));

COMMENT ON COLUMN public.profiles.role IS
  'Papel do usuário no ERP: owner (proprietário), technician (técnico bancada), receptionist (atendente de balcão)';

-- 2. Atualiza função admin_update_profile para suportar o novo papel
CREATE OR REPLACE FUNCTION public.admin_update_profile(
  p_target_id uuid,
  p_role text DEFAULT NULL,
  p_can_delete boolean DEFAULT NULL,
  p_active boolean DEFAULT NULL,
  p_commission_rate numeric DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $func$
DECLARE
  v_caller_role text;
  v_updated record;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT role INTO v_caller_role FROM public.profiles WHERE id = auth.uid();
    IF v_caller_role <> 'owner' THEN
      RAISE EXCEPTION 'Apenas proprietários podem alterar permissões' USING ERRCODE = 'insufficient_privilege';
    END IF;
  END IF;

  UPDATE public.profiles
  SET
    role = COALESCE(p_role, role),
    can_delete = COALESCE(p_can_delete, can_delete),
    active = COALESCE(p_active, active),
    commission_rate = COALESCE(p_commission_rate, commission_rate)
  WHERE id = p_target_id
  RETURNING id, full_name, email, role, can_delete, active, commission_rate INTO v_updated;

  IF v_updated.id IS NULL THEN
    RAISE EXCEPTION 'Usuário % não encontrado', p_target_id;
  END IF;

  RETURN to_jsonb(v_updated);
END;
$func$;

NOTIFY pgrst, 'reload schema';
