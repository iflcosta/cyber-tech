-- ============================================================
-- 0007_os_photos.sql — bucket de fotos + coluna photo_url
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- Adiciona:
--   - coluna service_orders.photo_url (text, URL publica do Storage)
--   - bucket 'os-photos' (public) com limite de 5MB por arquivo
--   - policies de Storage: usuarios autenticados podem ler, fazer
--     upload e deletar fotos; anonimos so' leem.
--
-- Nao e' no MVP original (AGENTS.md fala 'fora do MVP: fotos do
-- aparelho') mas o Iago pediu 2026-06-18. Cobertura minima:
--   - 1 foto por OS (a foto principal - antes/depois do conserto)
--   - upload via camera do celular (input file com capture)
--   - exibida na pagina de detalhe, com fallback elegante

ALTER TABLE public.service_orders
  ADD COLUMN IF NOT EXISTS photo_url text NULL;

-- Cria o bucket (idempotente: nao da erro se ja existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'os-photos',
  'os-photos',
  true,
  5 * 1024 * 1024,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Policies de storage: autenticados podem fazer upload/delete,
-- todos (incluindo anonimos) podem ler (bucket e' public).
DROP POLICY IF EXISTS "os_photos_select_public" ON storage.objects;
CREATE POLICY "os_photos_select_public" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'os-photos');

DROP POLICY IF EXISTS "os_photos_insert_authenticated" ON storage.objects;
CREATE POLICY "os_photos_insert_authenticated" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'os-photos');

DROP POLICY IF EXISTS "os_photos_delete_authenticated" ON storage.objects;
CREATE POLICY "os_photos_delete_authenticated" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'os-photos');

NOTIFY pgrst, 'reload schema';
