-- ============================================================================
-- MIGRATION 0037: FUNIL CRM DE PROSPECÇÃO — SUPORTE EM TI (LEADS WHATSAPP)
-- ============================================================================
-- Armazena o status do funil de prospecção, sub-nicho e anotações comerciais
-- para cada telefone abordado na Central de Leads (/admin/clientes/leads).

CREATE TABLE IF NOT EXISTS public.it_support_leads (
  phone_e164        text PRIMARY KEY,
  name              text NOT NULL,
  segment           text NOT NULL DEFAULT 'b2c',
  niche             text NOT NULL DEFAULT 'residencial_pf',
  status            text NOT NULL DEFAULT 'novo'
                    CHECK (status IN ('novo', 'contatado', 'respondeu', 'proposta', 'fechado', 'sem_interesse')),
  notes             text,
  last_contacted_at timestamptz,
  updated_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_it_support_leads_status ON public.it_support_leads(status);
CREATE INDEX IF NOT EXISTS idx_it_support_leads_niche ON public.it_support_leads(niche);

ALTER TABLE public.it_support_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "it_support_leads_authenticated_all" ON public.it_support_leads;
CREATE POLICY "it_support_leads_authenticated_all"
  ON public.it_support_leads
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
