-- Remove a assinatura antiga de create_sale (sem p_customer_id) — a
-- 0024 criou uma nova sobrecarga em vez de substituir, já que
-- CREATE OR REPLACE só troca a função quando os parâmetros batem
-- exatamente. Duas sobrecargas ativas confundiriam o PostgREST na
-- hora de resolver a chamada via RPC.
DROP FUNCTION IF EXISTS public.create_sale(jsonb, text, text, text, numeric, text);

NOTIFY pgrst, 'reload schema';
