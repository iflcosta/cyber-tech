-- ============================================================
-- 0018_equipment_photos.sql — foto do aparelho na entrada
-- ============================================================
--
-- Contexto (2026-08-06): sem prova visual do estado do aparelho na
-- entrada, disputa tipo "a tela já tava trincada" fica só na palavra
-- do cliente vs. da loja. Adiciona coluna de URLs de foto + bucket
-- de storage dedicado (separado do bucket "products" do site
-- público, que é de outro projeto Supabase).

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS equipment_photos text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.service_orders.equipment_photos IS 'URLs públicas das fotos do aparelho tiradas na entrada (bucket equipment-photos). Prova visual do estado em que chegou.';

-- Bucket de storage (público pra leitura — fotos de aparelho não são
-- dado sensível a ponto de justificar signed URL; leitura pública
-- simplifica exibição direto por <img src>)
INSERT INTO storage.buckets (id, name, public)
VALUES ('equipment-photos', 'equipment-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read equipment photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload equipment photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete equipment photos" ON storage.objects;

CREATE POLICY "Public read equipment photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'equipment-photos');

CREATE POLICY "Authenticated upload equipment photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'equipment-photos');

CREATE POLICY "Authenticated delete equipment photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'equipment-photos');

NOTIFY pgrst, 'reload schema';
