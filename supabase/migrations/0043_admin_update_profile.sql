-- ============================================================
-- 0043_admin_update_profile.sql
-- ============================================================
-- Cria a função RPC admin_update_profile para permitir que proprietários
-- alterem papéis (role), permissão de exclusão (can_delete), status ativo e comissões.

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
  -- Se chamado no contexto de usuario logado, exige ser owner
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

REVOKE EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, boolean, boolean, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, boolean, boolean, numeric) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, boolean, boolean, numeric) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';
