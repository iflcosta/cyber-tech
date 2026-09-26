-- ============================================================================
-- MIGRATION 0038: MÉTRICAS DE CONVERSAS 1-A-1 E LEADS QUENTES (WHATSAPP LOJA)
-- ============================================================================
-- Adiciona indicadores de conversa direta 1-a-1, volume de mensagens trocadas
-- (enviadas pela loja e recebidas do cliente), data da última conversa e
-- marcação de agenda para identificar Clientes Já Atendidos ("Leads Quentes").

ALTER TABLE public.it_support_leads
  ADD COLUMN IF NOT EXISTS is_hot_lead      boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_direct_chat  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_address_book  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS msgs_sent        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS msgs_received    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_chat_date   text;

CREATE INDEX IF NOT EXISTS idx_it_support_leads_hot
  ON public.it_support_leads(is_hot_lead, msgs_sent DESC);
