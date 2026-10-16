-- =============================================================================
-- 0048_argon4_audit_fixes.sql
-- Auditoria Completa de Fronteira (Argon 4):
-- 1. Motor de Comissões: Geração exclusiva em OS Pronta/Entregue ('ready'/'delivered'),
--    eliminação de duplicidade ao trocar técnico e limpeza ao excluir último serviço.
-- 2. Remoção de sobrecarga ambígua em public.create_sale (PGRST203).
-- 3. Auto-SKU em stock_items e melhoria de create_stock_item_and_use (custo e estimativa).
-- 4. Inclusão do papel 'receptionist' nas políticas RLS operacionais e blindagem
--    de RLS em tabelas financeiras (exigindo perfil ativo e permissão de exclusão).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. FUNÇÃO AUXILIAR DE STAFF ATIVO (owner, technician, receptionist com active = true)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    public.current_user_role() IN ('owner', 'technician', 'receptionist'),
    false
  );
$function$;

REVOKE EXECUTE ON FUNCTION public.is_active_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_staff() TO authenticated, service_role;

-- Blindagem de admin_update_profile para exigir is_owner() (que valida active = true)
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
  v_updated record;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_owner() THEN
    RAISE EXCEPTION 'Apenas proprietários ativos podem alterar permissões'
      USING ERRCODE = 'insufficient_privilege';
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

REVOKE EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, boolean, boolean, numeric) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_profile(uuid, text, boolean, boolean, numeric) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. REMOÇÃO DE SOBRECARGA AMBÍGUA DE public.create_sale
-- Mantém apenas a assinatura canônica de 0041:
-- (jsonb, text, text, text, uuid, numeric, text)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_sale(jsonb, text, text, text, numeric, text, uuid);
DROP FUNCTION IF EXISTS public.create_sale(jsonb, text, text, text, numeric, text);

-- -----------------------------------------------------------------------------
-- 3. AUTO-SKU EM stock_items & MELHORIA DE create_stock_item_and_use
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_stock_items_auto_sku()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.id IS NULL THEN
    NEW.id := gen_random_uuid();
  END IF;
  IF NEW.internal_sku IS NULL OR btrim(NEW.internal_sku) = '' THEN
    NEW.internal_sku := 'CYB-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_stock_items_auto_sku ON public.stock_items;
CREATE TRIGGER trg_stock_items_auto_sku
  BEFORE INSERT ON public.stock_items
  FOR EACH ROW EXECUTE FUNCTION public.fn_stock_items_auto_sku();

-- Preenche internal_sku em quaisquer itens antigos que estejam sem código
UPDATE public.stock_items
SET internal_sku = 'CYB-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 6))
WHERE internal_sku IS NULL OR btrim(internal_sku) = '';

-- Atualiza create_stock_item_and_use para preencher unit_cost e preservar labor_cost no estimated_value
CREATE OR REPLACE FUNCTION public.create_stock_item_and_use(
  p_name text,
  p_unit_price numeric,
  p_quantity int,
  p_service_order_id uuid,
  p_category text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_item_id uuid;
  v_total numeric;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_active_staff() THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = 'insufficient_privilege';
  END IF;

  IF trim(coalesce(p_name, '')) = '' THEN
    RAISE EXCEPTION 'Nome da peça é obrigatório';
  END IF;
  IF p_unit_price IS NULL OR p_unit_price <= 0 THEN
    RAISE EXCEPTION 'Preço deve ser maior que zero';
  END IF;
  IF p_quantity IS NULL OR p_quantity <= 0 THEN
    RAISE EXCEPTION 'Quantidade deve ser maior que zero';
  END IF;

  IF p_service_order_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.service_orders WHERE id = p_service_order_id
  ) THEN
    RAISE EXCEPTION 'OS % não encontrada', p_service_order_id;
  END IF;

  v_total := ROUND(p_unit_price * p_quantity, 2);

  -- Reutiliza item existente se tiver exatamente o mesmo nome, categoria de peça encomendada e estoque zerado,
  -- evitando poluir o catálogo com dezenas de duplicatas idênticas sem giro
  SELECT id INTO v_item_id
  FROM public.stock_items
  WHERE LOWER(btrim(name)) = LOWER(btrim(p_name))
    AND active = true
    AND current_stock = 0
  ORDER BY updated_at DESC
  LIMIT 1;

  IF v_item_id IS NULL THEN
    INSERT INTO public.stock_items (name, category, unit_price, unit_cost)
    VALUES (
      btrim(p_name),
      NULLIF(btrim(coalesce(p_category, '')), ''),
      p_unit_price,
      p_unit_price
    )
    RETURNING id INTO v_item_id;
  ELSE
    UPDATE public.stock_items
    SET unit_price = p_unit_price,
        unit_cost = COALESCE(unit_cost, p_unit_price),
        updated_at = now()
    WHERE id = v_item_id;
  END IF;

  INSERT INTO public.stock_movements (
    stock_item_id, movement_type, quantity, unit_price, total_amount, notes, author_id
  ) VALUES (
    v_item_id, 'in', p_quantity, p_unit_price, v_total,
    'Entrada automática ao aplicar peça na OS', auth.uid()
  );

  INSERT INTO public.stock_movements (
    stock_item_id, movement_type, quantity, unit_price, total_amount, service_order_id, author_id
  ) VALUES (
    v_item_id, 'out', p_quantity, p_unit_price, v_total, p_service_order_id, auth.uid()
  );

  RETURN v_item_id;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_stock_item_and_use(text, numeric, int, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_stock_item_and_use(text, numeric, int, uuid, text) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 4. MOTOR DE COMISSÕES (recompute_os_commission)
-- Regras de negócio:
-- a) Sincroniza labor_cost e estimated_value sempre que houver itens em service_order_services.
-- b) Se o último serviço de service_order_services for excluído, zera labor_cost.
-- c) Comissão ('pending' em commission_ledger) SÓ É GERADA quando a OS estiver
--    com status 'ready' (Pronta) ou 'delivered' (Entregue).
-- d) Ao trocar o técnico da OS ou do serviço, apaga imediatamente a comissão
--    pendente do técnico anterior (sem duplicar).
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.recompute_os_commission(p_os_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_has_services    boolean;
  v_os_pay_status   text;
  v_os_status       text;
  v_rec             record;
  v_legacy_tech_id  uuid;
  v_legacy_rate     numeric(4,2);
  v_legacy_name     text;
  v_current_labor   numeric(10,2);
  v_sum_labor       numeric(10,2);
  v_parts_total     numeric(10,2);
BEGIN
  -- 1. Busca status atual da OS
  SELECT payment_status, status, technician_id, labor_cost
  INTO v_os_pay_status, v_os_status, v_legacy_tech_id, v_current_labor
  FROM public.service_orders
  WHERE id = p_os_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- 2. Verifica se a OS possui procedimentos ativos em service_order_services
  SELECT EXISTS (
    SELECT 1 FROM public.service_order_services
    WHERE service_order_id = p_os_id AND status <> 'cancelled'
  ) INTO v_has_services;

  -- 3. Se houver procedimentos discriminados (Modo 1), mantém labor_cost e estimated_value
  --    sincronizados na OS independentemente do status da OS
  IF v_has_services THEN
    SELECT COALESCE(SUM(labor_cost), 0.00) INTO v_sum_labor
    FROM public.service_order_services
    WHERE service_order_id = p_os_id AND status <> 'cancelled';

    SELECT COALESCE(SUM(total_amount), 0.00) INTO v_parts_total
    FROM public.stock_movements
    WHERE service_order_id = p_os_id AND movement_type IN ('out', 'sale');

    IF v_current_labor IS DISTINCT FROM v_sum_labor THEN
      UPDATE public.service_orders
      SET labor_cost = v_sum_labor,
          estimated_value = v_sum_labor + v_parts_total
      WHERE id = p_os_id;
      v_current_labor := v_sum_labor;
    END IF;
  END IF;

  -- 4. REGRA DE NEGÓCIO: A comissão só é gerada quando o aparelho é marcado como
  --    PRONTO ('ready') ou ENTREGUE ('delivered').
  --    Se a OS ainda está em bancada/orçamento ou foi cancelada, remove lançamentos 'pending'.
  IF v_os_status NOT IN ('ready', 'delivered') THEN
    DELETE FROM public.commission_ledger
    WHERE service_order_id = p_os_id
      AND status = 'pending';
    RETURN;
  END IF;

  -- 5. Geração / Atualização das comissões para OS Pronta ou Entregue
  IF v_has_services THEN
    -- MODO 1: Rateio Multi-Técnico por serviço (service_order_services)
    -- Remove qualquer lançamento pendente cujo par (service_order_service_id, technician_id)
    -- não corresponda mais a um serviço ativo com comissão > 0
    DELETE FROM public.commission_ledger cl
    WHERE cl.service_order_id = p_os_id
      AND cl.status = 'pending'
      AND NOT EXISTS (
        SELECT 1
        FROM public.service_order_services sos
        JOIN public.profiles p ON p.id = sos.technician_id
        WHERE sos.service_order_id = p_os_id
          AND sos.id = cl.service_order_service_id
          AND sos.technician_id = cl.technician_id
          AND sos.status <> 'cancelled'
          AND sos.labor_cost > 0
          AND COALESCE(p.commission_rate, 0.00) > 0.00
      );

    FOR v_rec IN (
      SELECT
        sos.id AS service_item_id,
        sos.service_name,
        sos.labor_cost,
        sos.technician_id,
        p.full_name AS tech_name,
        COALESCE(p.commission_rate, 0.00) AS comm_rate
      FROM public.service_order_services sos
      LEFT JOIN public.profiles p ON p.id = sos.technician_id
      WHERE sos.service_order_id = p_os_id
        AND sos.status <> 'cancelled'
    ) LOOP
      IF v_rec.technician_id IS NOT NULL AND v_rec.comm_rate > 0.00 AND v_rec.labor_cost > 0.00 THEN
        INSERT INTO public.commission_ledger (
          service_order_id,
          service_order_service_id,
          service_description,
          technician_id,
          technician_name,
          labor_amount,
          commission_rate,
          commission_amount,
          os_payment_status,
          updated_at
        ) VALUES (
          p_os_id,
          v_rec.service_item_id,
          v_rec.service_name,
          v_rec.technician_id,
          COALESCE(v_rec.tech_name, 'Técnico'),
          v_rec.labor_cost,
          v_rec.comm_rate,
          ROUND(v_rec.labor_cost * v_rec.comm_rate, 2),
          COALESCE(v_os_pay_status, 'pending'),
          now()
        )
        ON CONFLICT (service_order_id, technician_id, COALESCE(service_order_service_id, '00000000-0000-0000-0000-000000000000'::uuid))
        DO UPDATE SET
          service_description = EXCLUDED.service_description,
          labor_amount = EXCLUDED.labor_amount,
          commission_rate = EXCLUDED.commission_rate,
          commission_amount = EXCLUDED.commission_amount,
          os_payment_status = EXCLUDED.os_payment_status,
          technician_name = EXCLUDED.technician_name,
          updated_at = now()
        WHERE public.commission_ledger.status = 'pending';
      END IF;
    END LOOP;

  ELSE
    -- MODO 2: Técnico único na OS (sem itens em service_order_services)
    SELECT p.full_name, COALESCE(p.commission_rate, 0.00)
    INTO v_legacy_name, v_legacy_rate
    FROM public.profiles p
    WHERE p.id = v_legacy_tech_id;

    -- Remove lançamentos pendentes de outros técnicos anteriores ou de serviços removidos
    DELETE FROM public.commission_ledger cl
    WHERE cl.service_order_id = p_os_id
      AND cl.status = 'pending'
      AND (
        cl.service_order_service_id IS NOT NULL
        OR v_legacy_tech_id IS NULL
        OR cl.technician_id IS DISTINCT FROM v_legacy_tech_id
        OR COALESCE(v_legacy_rate, 0.00) <= 0.00
        OR COALESCE(v_current_labor, 0.00) <= 0.00
      );

    IF v_legacy_tech_id IS NULL OR COALESCE(v_legacy_rate, 0.00) <= 0.00 OR COALESCE(v_current_labor, 0.00) <= 0.00 THEN
      RETURN;
    END IF;

    INSERT INTO public.commission_ledger (
      service_order_id,
      technician_id,
      technician_name,
      labor_amount,
      commission_rate,
      commission_amount,
      os_payment_status,
      updated_at
    ) VALUES (
      p_os_id,
      v_legacy_tech_id,
      COALESCE(v_legacy_name, 'Técnico'),
      COALESCE(v_current_labor, 0.00),
      v_legacy_rate,
      ROUND(COALESCE(v_current_labor, 0.00) * v_legacy_rate, 2),
      COALESCE(v_os_pay_status, 'pending'),
      now()
    )
    ON CONFLICT (service_order_id, technician_id, COALESCE(service_order_service_id, '00000000-0000-0000-0000-000000000000'::uuid))
    DO UPDATE SET
      labor_amount = EXCLUDED.labor_amount,
      commission_rate = EXCLUDED.commission_rate,
      commission_amount = EXCLUDED.commission_amount,
      os_payment_status = EXCLUDED.os_payment_status,
      technician_name = EXCLUDED.technician_name,
      updated_at = now()
    WHERE public.commission_ledger.status = 'pending';
  END IF;
END;
$function$;

-- Trigger de sincronização em service_order_services (trata exclusão do último serviço)
CREATE OR REPLACE FUNCTION public.trg_service_order_services_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_os_id uuid;
  v_remaining int;
  v_parts_total numeric(10,2);
BEGIN
  v_os_id := COALESCE(NEW.service_order_id, OLD.service_order_id);

  -- Se foi DELETE ou cancelamento e não restou nenhum procedimento ativo, zera labor_cost na OS
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.status = 'cancelled') THEN
    SELECT COUNT(*) INTO v_remaining
    FROM public.service_order_services
    WHERE service_order_id = v_os_id AND status <> 'cancelled';

    IF v_remaining = 0 THEN
      SELECT COALESCE(SUM(total_amount), 0.00) INTO v_parts_total
      FROM public.stock_movements
      WHERE service_order_id = v_os_id AND movement_type IN ('out', 'sale');

      UPDATE public.service_orders
      SET labor_cost = 0.00,
          estimated_value = v_parts_total
      WHERE id = v_os_id;
    END IF;
  END IF;

  PERFORM public.recompute_os_commission(v_os_id);
  RETURN COALESCE(NEW, OLD);
END;
$function$;

DROP TRIGGER IF EXISTS trg_so_services_sync_commission ON public.service_order_services;
CREATE TRIGGER trg_so_services_sync_commission
  AFTER INSERT OR UPDATE OR DELETE ON public.service_order_services
  FOR EACH ROW EXECUTE FUNCTION public.trg_service_order_services_sync();

-- Unifica as triggers de comissão em service_orders (remove duplicata da 0034)
DROP TRIGGER IF EXISTS trg_service_orders_recompute_commission ON public.service_orders;
DROP TRIGGER IF EXISTS trg_so_sync_comm ON public.service_orders;

CREATE OR REPLACE FUNCTION public.trg_service_orders_commission_sync()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status IN ('ready', 'delivered') THEN
      PERFORM public.recompute_os_commission(NEW.id);
    END IF;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF (OLD.status IS DISTINCT FROM NEW.status) OR
       (OLD.payment_status IS DISTINCT FROM NEW.payment_status) OR
       (OLD.technician_id IS DISTINCT FROM NEW.technician_id) OR
       (OLD.labor_cost IS DISTINCT FROM NEW.labor_cost) THEN
      PERFORM public.recompute_os_commission(NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_so_sync_comm
  AFTER INSERT OR UPDATE OF status, payment_status, technician_id, labor_cost ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.trg_service_orders_commission_sync();

-- Reconcilia todas as OSs existentes com a nova regra (apenas Prontas/Entregues geram comissão)
DO $$
DECLARE
  v_os_id uuid;
BEGIN
  FOR v_os_id IN SELECT id FROM public.service_orders LOOP
    PERFORM public.recompute_os_commission(v_os_id);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 5. ATUALIZAÇÃO DE RLS PARA RECEPTIONIST E TABELAS FINANCEIRAS
-- -----------------------------------------------------------------------------

-- 5.1 Permite que 'receptionist' (além de 'owner' e 'technician') edite OS e insira eventos
DROP POLICY IF EXISTS service_orders_update_staff ON public.service_orders;
CREATE POLICY service_orders_update_staff ON public.service_orders
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_active_staff()))
  WITH CHECK ((SELECT public.is_active_staff()));

DROP POLICY IF EXISTS service_order_events_insert_staff ON public.service_order_events;
CREATE POLICY service_order_events_insert_staff ON public.service_order_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND (SELECT public.is_active_staff())
  );

-- 5.2 Blindagem de service_order_services
DROP POLICY IF EXISTS "Authenticated users can manage so_services" ON public.service_order_services;
DROP POLICY IF EXISTS "Staff can insert_update so_services" ON public.service_order_services;
DROP POLICY IF EXISTS "Staff can delete so_services" ON public.service_order_services;

CREATE POLICY "Staff can insert_update so_services"
  ON public.service_order_services FOR ALL
  TO authenticated
  USING ((SELECT public.is_active_staff()))
  WITH CHECK ((SELECT public.is_active_staff()));

-- 5.3 Blindagem de cash_sessions e cash_entries
DROP POLICY IF EXISTS "Authenticated users can manage cash_sessions" ON public.cash_sessions;
CREATE POLICY "Authenticated users can manage cash_sessions"
  ON public.cash_sessions FOR ALL
  TO authenticated
  USING ((SELECT public.is_active_staff()))
  WITH CHECK ((SELECT public.is_active_staff()));

DROP POLICY IF EXISTS "Authenticated users can manage cash_entries" ON public.cash_entries;
DROP POLICY IF EXISTS "Staff can insert_update cash_entries" ON public.cash_entries;
DROP POLICY IF EXISTS "Owners or can_delete can delete cash_entries" ON public.cash_entries;

CREATE POLICY "Staff can insert_update cash_entries"
  ON public.cash_entries FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_active_staff()));

CREATE POLICY "Staff can update cash_entries"
  ON public.cash_entries FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_active_staff()))
  WITH CHECK ((SELECT public.is_active_staff()));

CREATE POLICY "Owners or can_delete can delete cash_entries"
  ON public.cash_entries FOR DELETE
  TO authenticated
  USING ((SELECT public.is_owner()) OR (SELECT public.can_delete()));

-- 5.4 Blindagem de settlement_batches e used_device_purchases
DROP POLICY IF EXISTS "Only staff can manage settlement_batches" ON public.settlement_batches;
CREATE POLICY "Only staff can manage settlement_batches"
  ON public.settlement_batches FOR ALL
  TO authenticated
  USING ((SELECT public.is_active_staff()))
  WITH CHECK ((SELECT public.is_active_staff()));

DROP POLICY IF EXISTS "Authenticated users can manage used_purchases" ON public.used_device_purchases;
CREATE POLICY "Authenticated users can manage used_purchases"
  ON public.used_device_purchases FOR ALL
  TO authenticated
  USING ((SELECT public.is_active_staff()))
  WITH CHECK ((SELECT public.is_active_staff()));

NOTIFY pgrst, 'reload schema';
