-- Migration 0002: relaxar permissao de UPDATE em service_orders
--
-- Antes (0001): tecnico so editava OS onde assigned_to = auth.uid().
-- Agora (decisao do Felipe 2026-06-18): qualquer tecnico logado pode
-- editar QUALQUER OS (mudar status, atribuir, adicionar nota).
--
-- Razao: Iago/Jefferson precisam redistribuir OS entre si no dia-a-dia.
-- Se Iago termina o turno, Jefferson precisa conseguir pegar a OS que
-- estava com Iago sem ter que ligar pro Felipe. A timeline registra
-- tudo, entao ha auditoria.
--
-- Owner segue com acesso total. INSERT/SELECT/DELETE inalterados.

DROP POLICY IF EXISTS "Owner or assigned technician can update service orders"
  ON public.service_orders;

CREATE POLICY "Owner or any technician can update service orders"
  ON public.service_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'technician' AND p.active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'owner'
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'technician' AND p.active = true
    )
  );