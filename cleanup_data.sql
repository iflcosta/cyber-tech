-- CYBER TECH - DATA CLEANUP SCRIPT
-- USE COM CAUTELA: Este script apaga todos os registros de leads e avaliações.

-- 1. Apagar todas as avaliações
DELETE FROM reviews;

-- 2. Apagar todos os leads (zerando o histórico de vendas/comissões)
DELETE FROM leads;

-- Nota: Os produtos e configurações permanecem intactos.
