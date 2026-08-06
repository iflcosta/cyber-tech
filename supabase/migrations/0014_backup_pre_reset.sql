-- ============================================================
-- 0014_backup_pre_reset.sql — snapshot antes do reset operacional
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- Contexto (2026-08-06): o ERP estava desorganizado (servicos sem OS
-- cadastrada, estoque sem controle). Antes de zerar os dados
-- transacionais (migration 0015), este script guarda uma copia de
-- tudo dentro do schema "archive" — que NAO e exposto pela API do
-- Supabase (PostgREST so expoe o schema "public" por padrao), entao
-- fica guardado com seguranca sem custo de export/CSV manual.
--
-- Se precisar consultar algo depois do reset (auditoria, cliente
-- reclamando, fiscal), e so' rodar SELECT * FROM archive.<tabela>.
--
-- NAO apaga nada. So' copia. O reset em si esta' na 0015.

CREATE SCHEMA IF NOT EXISTS archive;

-- Tabelas do modulo de OS
CREATE TABLE IF NOT EXISTS archive.customers_20260806 AS TABLE public.customers;
CREATE TABLE IF NOT EXISTS archive.service_orders_20260806 AS TABLE public.service_orders;
CREATE TABLE IF NOT EXISTS archive.service_order_events_20260806 AS TABLE public.service_order_events;

-- Tabelas de estoque e vendas (existem no banco mas nao tem
-- migration salva neste repo ainda — foram aplicadas direto pelo
-- SQL Editor. Este backup funciona do mesmo jeito.)
CREATE TABLE IF NOT EXISTS archive.stock_items_20260806 AS TABLE public.stock_items;
CREATE TABLE IF NOT EXISTS archive.stock_movements_20260806 AS TABLE public.stock_movements;
CREATE TABLE IF NOT EXISTS archive.sales_20260806 AS TABLE public.sales;
CREATE TABLE IF NOT EXISTS archive.sale_items_20260806 AS TABLE public.sale_items;

-- Conferencia rapida: quantas linhas foram para o backup de cada tabela
SELECT 'customers' AS tabela, count(*) FROM archive.customers_20260806
UNION ALL SELECT 'service_orders', count(*) FROM archive.service_orders_20260806
UNION ALL SELECT 'service_order_events', count(*) FROM archive.service_order_events_20260806
UNION ALL SELECT 'stock_items', count(*) FROM archive.stock_items_20260806
UNION ALL SELECT 'stock_movements', count(*) FROM archive.stock_movements_20260806
UNION ALL SELECT 'sales', count(*) FROM archive.sales_20260806
UNION ALL SELECT 'sale_items', count(*) FROM archive.sale_items_20260806;

-- Confira o resultado do SELECT acima e compare com o que voces
-- esperam ver na tela antes de rodar a 0015. Se os numeros baterem,
-- pode seguir pro reset.
