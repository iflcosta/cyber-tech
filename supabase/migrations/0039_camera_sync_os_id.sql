-- Migration: 0039_camera_sync_os_id
-- Adiciona coluna os_id à tabela camera_sync_sessions para vincular
-- sessões de câmera a Ordens de Serviço específicas.

ALTER TABLE public.camera_sync_sessions
  ADD COLUMN IF NOT EXISTS os_id uuid REFERENCES public.service_orders(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.camera_sync_sessions.os_id IS
  'OS à qual esta sessão de câmera está vinculada, para atualização automática de equipment_photos ao fazer upload pelo celular';
