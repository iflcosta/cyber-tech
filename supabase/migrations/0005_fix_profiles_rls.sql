-- ============================================================
-- 0005_fix_profiles_rls.sql — corrigir recursao infinita em profiles
-- Rodar no SQL Editor do painel do Supabase. Uma unica vez.
-- ============================================================
--
-- Problema: as policies originais de profiles faziam
--   USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'owner'))
-- Isso cria recursao infinita: a policy executa um SELECT em profiles
-- que re-dispara a propria policy em loop. Postgres aborta com
--   "infinite recursion detected in policy for relation 'profiles'"
-- E o app inteiro quebra (qualquer query que toca profiles falha).
--
-- Solucao: criar uma funcao SECURITY DEFINER que le o role do usuario
-- SEM disparar a policy de profiles. SECURITY DEFINER executa com
-- privilegios do owner da funcao (postgres), bypassando RLS.
-- As policies passam a usar essa funcao em vez de fazer SELECT direto.

-- Funcao helper: retorna o role do usuario logado
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

-- Dropar policies problematicas
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_owner" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_owner" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Owners can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Owners can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;

-- Recriar policies limpas
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_owner_or_self" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.current_user_role() = 'owner'
    OR id = auth.uid()
  )
  WITH CHECK (
    public.current_user_role() = 'owner'
    OR id = auth.uid()
  );

CREATE POLICY "profiles_insert_owner_only" ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() = 'owner');

CREATE POLICY "profiles_delete_owner_only" ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.current_user_role() = 'owner');

-- Comentario: deixar o role do profile no JWT tambem ajuda, mas e'
-- trabalho maior. A funcao SECURITY DEFINER resolve sem mexer em auth.
