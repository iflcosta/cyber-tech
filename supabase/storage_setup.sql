-- Script para configuração do Bucket de Imagens (products)
-- Execute este script no SQL Editor do seu Dashboard do Supabase

-- 1. Criar o bucket se ele não existir
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Configurar Políticas de RLS para o Bucket 'products'
-- Nota: Deletamos políticas antigas para evitar conflitos se você estiver re-executando
DROP POLICY IF EXISTS "Acesso Público para Ver Imagens" ON storage.objects;
DROP POLICY IF EXISTS "Apenas Admins podem subir imagens" ON storage.objects;
DROP POLICY IF EXISTS "Apenas Admins podem deletar imagens" ON storage.objects;

-- Política 1: Permitir que qualquer pessoa veja as imagens (Público)
CREATE POLICY "Acesso Público para Ver Imagens"
ON storage.objects FOR SELECT
USING ( bucket_id = 'products' );

-- Política 2: Permitir que apenas usuários autenticados (Admins) subam arquivos
CREATE POLICY "Apenas Admins podem subir imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'products' );

-- Política 3: Permitir que apenas usuários autenticados (Admins) deletem arquivos
CREATE POLICY "Apenas Admins podem deletar imagens"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'products' );
