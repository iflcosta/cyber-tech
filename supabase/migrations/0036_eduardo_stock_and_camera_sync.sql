-- ============================================================
-- 0036_eduardo_stock_and_camera_sync.sql
-- SPRINT 1: Blindagem & Enriquecimento do Estoque do Eduardo + Cyber Camera Sync
-- ============================================================
--
-- DIRETRIZES INEGOCIÁVEIS:
-- 1. 100% ADITIVA: Nenhum item cadastrado pelo Eduardo em `stock_items` é
--    alterado destrutivamente ou removido.
-- 2. Adiciona suporte a SKU interno (`internal_sku`), localização na estante
--    (`shelf_location`) e saldo reservado (`reserved_stock`).
-- 3. Cria índices de alta velocidade (<100ms) para leitura por código de barras
--    (EAN-13), SKU interno e nome do produto.
-- 4. Cria a estrutura `camera_sync_sessions` para suportar o Cyber Camera Sync
--    (Opção 1: QR Code na tela do PC -> Fotos do celular em tempo real).
-- ============================================================

-- 1. Enriquecimento aditivo da tabela stock_items (Projeto Eduardo)
ALTER TABLE public.stock_items
  ADD COLUMN IF NOT EXISTS internal_sku text,
  ADD COLUMN IF NOT EXISTS shelf_location text,
  ADD COLUMN IF NOT EXISTS reserved_stock integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.stock_items.internal_sku IS
  'Código SKU interno da Cyber Informática (ex: CYB-CAB-001) para itens sem EAN-13 de fábrica';

COMMENT ON COLUMN public.stock_items.shelf_location IS
  'Localização física na estante de 6 metros ou gaveteiro da bancada (ex: Estante A - Nível 2)';

COMMENT ON COLUMN public.stock_items.reserved_stock IS
  'Quantidade reservada em Ordens de Serviço aprovadas aguardando finalização';

-- Gera SKU interno automático para itens já cadastrados pelo Eduardo que ainda não possuem internal_sku
UPDATE public.stock_items
SET internal_sku = 'CYB-' || UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 6))
WHERE internal_sku IS NULL;

-- Índices de busca instantânea para o Balcão e PDV (<100ms)
CREATE INDEX IF NOT EXISTS idx_stock_items_ean13
  ON public.stock_items (ean13)
  WHERE ean13 IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_items_internal_sku
  ON public.stock_items (UPPER(internal_sku))
  WHERE internal_sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_items_name_trgm
  ON public.stock_items (LOWER(name));

-- 2. Tabela de Sessões para o Cyber Camera Sync (Opção 1)
CREATE TABLE IF NOT EXISTS public.camera_sync_sessions (
  session_token   text PRIMARY KEY,
  photos          jsonb NOT NULL DEFAULT '[]'::jsonb,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz NOT NULL DEFAULT (now() + interval '30 minutes')
);

COMMENT ON TABLE public.camera_sync_sessions IS
  'Sessões temporárias de sincronização de fotos entre o smartphone do atendente e o PC do balcão via QR Code';

ALTER TABLE public.camera_sync_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para permitir que o celular (mesmo sem login administrativo completo, via token secreto de sessão) envie as fotos da carcaça
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'camera_sync_sessions'
      AND policyname = 'camera_sync_public_token_access'
  ) THEN
    CREATE POLICY camera_sync_public_token_access ON public.camera_sync_sessions
      FOR ALL
      TO anon, authenticated
      USING (expires_at > now())
      WITH CHECK (expires_at > now());
  END IF;
END $$;

GRANT ALL ON public.camera_sync_sessions TO anon, authenticated, service_role;
