import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { GET } from '@/app/api/status/track/route';
import {
  resolveEquipmentCategory,
  getEquipmentTypeLabel,
  getChecklistFieldsForEquipment,
  getQuickSymptomChips,
} from '@/app/admin/types/database';

describe('API Route — /api/status/track (Portal de Rastreio Público — Sem Mocks)', () => {
  it('rejeita com HTTP 400 se nenhum parâmetro de busca for informado', async () => {
    const req = new Request('http://localhost:3000/api/status/track');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.found).toBe(false);
    expect(json.error).toContain('Informe o número da OS ou telefone');
  });

  it('retorna HTTP 404 (found: false) quando a OS não existe no banco real (sem dados mockados)', async () => {
    const req = new Request('http://localhost:3000/api/status/track?q=999999');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.found).toBe(false);
    expect(json.error).toContain('Nenhuma Ordem de Serviço encontrada');
  });

  it('classifica corretamente Impressoras (ex: HP Smart Tank 517) e gera checklist e sintomas específicos de impressora', () => {
    expect(resolveEquipmentCategory('impressora', 'HP', 'Smart Tank 517')).toBe('impressora');
    expect(resolveEquipmentCategory('outro', 'Impressora · HP', 'Smart Tank 517')).toBe('impressora');
    expect(getEquipmentTypeLabel('impressora', 'HP', 'Smart Tank 517')).toBe('Impressora');

    const checklist = getChecklistFieldsForEquipment('impressora', 'HP', 'Smart Tank 517');
    expect(checklist.some((f) => f.label.includes('Tracionador'))).toBe(true);
    expect(checklist.some((f) => f.label.includes('Cartuchos'))).toBe(true);

    const symptoms = getQuickSymptomChips('impressora', 'HP', 'Smart Tank 517');
    expect(symptoms.some((s) => s.includes('Cabeçote'))).toBe(true);
  });

  it('garante que o StatusTrackerClient diferencia OS em triagem inicial de OS com orçamento disponível e não exibe telemetria fake de PC nem upsell', () => {
    const clientPath = path.resolve(process.cwd(), 'src/app/status/StatusTrackerClient.tsx');
    const code = fs.readFileSync(clientPath, 'utf-8');

    expect(code).not.toContain('GPU EM CARGA');
    expect(code).not.toContain('SAÚDE DO DISCO');
    expect(code).toContain('isInInitialTriage');
    expect(code).toContain('hasQuoteReady');
    expect(code).toContain('VISTORIA FOTOGRÁFICA DE ENTRADA');
  });
});
