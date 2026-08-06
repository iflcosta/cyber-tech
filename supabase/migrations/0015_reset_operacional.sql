-- ============================================================
-- 0015_reset_operacional.sql — reboot do ERP: zera dados operacionais
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- RODAR SOMENTE DEPOIS de confirmar que a 0014 (backup) rodou certo.
-- ============================================================
--
-- Contexto (2026-08-06): OS e vendas ficaram desorganizadas —
-- servicos entrando e saindo sem OS cadastrada, estoque sem
-- confiabilidade. Decisao: zerar os dados transacionais e comecar
-- limpo, junto com uma contagem fisica real do estoque.
--
-- O que ESTE script apaga:
--   - service_order_events, service_orders (OS e timeline)
--   - customers (clientes)
--   - sale_items, sales (vendas do PDV)
--   - stock_movements, stock_items (estoque — junto com contagem
--     fisica nova a ser feita na loja)
--
-- O que NAO apaga:
--   - profiles / auth.users (login de Felipe, Iago, Jefferson)
--   - suppliers, part_orders, part_order_events (modulo novo,
--     criado na 0016 — nao existe ainda nesse momento)
--
-- Sequences: todas as sequences do schema public sao resetadas pra
-- comecar do 1 (short_id de OS, numeracao de venda, etc — nenhuma
-- delas precisa continuar de onde parou).

BEGIN;

TRUNCATE TABLE
  public.service_order_events,
  public.service_orders,
  public.sale_items,
  public.sales,
  public.stock_movements,
  public.stock_items,
  public.customers
CASCADE;

-- Reseta toda sequence do schema public (short_id de OS, numeracao
-- de venda, sku interno de estoque, etc). Generico de proposito —
-- nao depende de saber o nome exato de cada sequence.
DO $$
DECLARE
  seq record;
BEGIN
  FOR seq IN SELECT sequencename FROM pg_sequences WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER SEQUENCE public.%I RESTART WITH 1', seq.sequencename);
  END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- Depois de rodar: fazer a contagem fisica do estoque de revenda
-- (cabo, RAM, SSD, conector, etc) e recadastrar os itens em
-- /admin/crm/estoque com o saldo real contado na loja.
