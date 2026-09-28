-- ============================================================================
-- 0039_fix_camera_sync_storage_and_os_link.sql
-- Corrige upload público (anon via token QR Code) no bucket equipment-photos
-- e vincula sessões do Cyber Camera Sync diretamente à OS (os_id) via trigger
-- ============================================================================

-- 1. Coluna opcional os_id em camera_sync_sessions para sincronizar fotos
--    diretamente em uma Ordem de Serviço já criada ou recém-aberta.
ALTER TABLE public.camera_sync_sessions
  ADD COLUMN IF NOT EXISTS os_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL;

-- 2. Política de Storage para permitir que o celular (anon, sem login) faça
--    upload de fotos capturadas no Cyber Camera Sync (prefixo 'sync-') no
--    bucket 'equipment-photos'.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Anon upload camera sync equipment photos'
  ) THEN
    CREATE POLICY "Anon upload camera sync equipment photos"
      ON storage.objects
      FOR INSERT
      TO anon, authenticated
      WITH CHECK (
        bucket_id = 'equipment-photos'
        AND name LIKE 'sync-%'
      );
  END IF;
END $$;

-- 3. Trigger SECURITY DEFINER: sempre que uma sessão camera_sync_sessions
--    tiver um os_id vinculado e fotos adicionadas, anexa automaticamente as
--    novas fotos em public.service_orders.equipment_photos preservando a ordem.
CREATE OR REPLACE FUNCTION public.trg_sync_camera_photos_to_os()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_photos text[];
BEGIN
  IF NEW.os_id IS NOT NULL AND jsonb_typeof(NEW.photos) = 'array' AND jsonb_array_length(NEW.photos) > 0 THEN
    SELECT array_agg(elem)
    INTO v_new_photos
    FROM jsonb_array_elements_text(NEW.photos) AS elem;

    IF v_new_photos IS NOT NULL AND array_length(v_new_photos, 1) > 0 THEN
      UPDATE public.service_orders
      SET
        equipment_photos = (
          SELECT array_agg(u ORDER BY ord)
          FROM (
            SELECT u, MIN(ord) AS ord
            FROM unnest(COALESCE(equipment_photos, ARRAY[]::text[]) || v_new_photos) WITH ORDINALITY AS t(u, ord)
            WHERE u IS NOT NULL AND u <> ''
            GROUP BY u
          ) sub
        ),
        updated_at = now()
      WHERE id = NEW.os_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_camera_sync_to_os ON public.camera_sync_sessions;
CREATE TRIGGER trg_camera_sync_to_os
  AFTER INSERT OR UPDATE ON public.camera_sync_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_sync_camera_photos_to_os();

NOTIFY pgrst, 'reload schema';
