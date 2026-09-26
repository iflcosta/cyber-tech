import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { sanitizeSearchTerm } from '@/app/admin/lib/search';
import { STOCK_CATEGORY_SUGGESTIONS, type StockItem, type CameraSyncSession } from '@/app/admin/types/database';

describe('Sprint 1: Fundação do Banco Canônico & Blindagem do Estoque do Eduardo', () => {
  const migrationPath = path.resolve(
    process.cwd(),
    'supabase/migrations/0036_eduardo_stock_and_camera_sync.sql',
  );

  it('garante que a migration 0036 existe e é 100% aditiva (ZERO DROP TABLE ou TRUNCATE)', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    // Proibição sagrada: jamais dropar ou truncar tabelas de produção
    expect(sql.toUpperCase()).not.toContain('DROP TABLE');
    expect(sql.toUpperCase()).not.toContain('TRUNCATE');
    expect(sql.toUpperCase()).not.toContain('DELETE FROM PUBLIC.STOCK_ITEMS');

    // Enriquecimento aditivo do estoque do Eduardo
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS internal_sku');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS shelf_location');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS reserved_stock');
  });

  it('cria os índices de busca instantânea para o catálogo do Eduardo (EAN-13, SKU e Trigram)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('idx_stock_items_ean13');
    expect(sql).toContain('idx_stock_items_internal_sku');
    expect(sql).toContain('idx_stock_items_name_trgm');
  });

  it('cria a tabela camera_sync_sessions com RLS para o Cyber Camera Sync (Opção 1)', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.camera_sync_sessions');
    expect(sql).toContain('ALTER TABLE public.camera_sync_sessions ENABLE ROW LEVEL SECURITY');
    expect(sql).toContain('session_token');
    expect(sql).toContain('photos');
  });

  it('valida tipagem canônica de StockItem (com shelf_location e reserved_stock) e CameraSyncSession', () => {
    const sampleItem: StockItem = {
      id: 'item-eduardo-01',
      ean13: '7891234567890',
      internal_sku: 'CY-CAB-DP14-0001',
      name: 'Cabo DisplayPort 1.4 8K Malha Trançada 2m',
      category: 'Cabos',
      shelf_location: 'Estante 6m - Coluna B - Gaveta 03',
      brand: 'UGREEN',
      model: 'DP114',
      unit_cost: 35.0,
      unit_price: 89.9,
      current_stock: 12,
      reserved_stock: 2,
      min_stock: 5,
      active: true,
      notes: 'Cadastrado pelo Eduardo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(sampleItem.internal_sku).toBe('CY-CAB-DP14-0001');
    expect(sampleItem.shelf_location).toContain('Estante 6m');
    expect(sampleItem.current_stock - (sampleItem.reserved_stock ?? 0)).toBe(10);
    expect(STOCK_CATEGORY_SUGGESTIONS).toContain('Cabos');

    const sampleSession: CameraSyncSession = {
      session_token: 'tok_cyber_123456',
      photos: ['https://example.com/photo1.jpg'],
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 900_000).toISOString(),
    };

    expect(sampleSession.status).toBe('active');
    expect(sampleSession.photos).toHaveLength(1);
  });

  it('sanitiza termos de busca do catálogo do Eduardo preservando códigos SKU e EAN-13', () => {
    expect(sanitizeSearchTerm('CY-CAB-001')).toBe('CY-CAB-001');
    expect(sanitizeSearchTerm('7891234567890')).toBe('7891234567890');
    expect(sanitizeSearchTerm('Estante A')).toBe('Estante A');
  });
});
