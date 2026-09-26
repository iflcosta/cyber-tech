import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/status/track/route';

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
});
