import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/status/track/route';

describe('API Route — /api/status/track (Portal de Rastreio Público)', () => {
  it('rejeita com HTTP 400 se nenhum parâmetro de busca for informado', async () => {
    const req = new Request('http://localhost:3000/api/status/track');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.found).toBe(false);
    expect(json.error).toContain('Informe o número da OS ou telefone');
  });

  it('retorna os dados da OS com sanitização LGPD para consulta válida', async () => {
    const req = new Request('http://localhost:3000/api/status/track?q=CYB-1042');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.found).toBe(true);
    expect(json.short_id).toBeDefined();
    expect(json.status).toBeDefined();
    expect(json.reported_defect).toBeDefined();

    // LGPD: Apenas o primeiro nome ou "Cliente" deve ser exposto publicamente
    expect(json.customer_first_name).toBeDefined();
    expect(json.customer_name).toBeUndefined(); // Nome completo NUNCA deve vazar
    expect(json.customer_phone).toBeUndefined(); // Telefone NUNCA deve vazar
  });

  it('inclui checklist de integridade e fotos no retorno de rastreio', async () => {
    const req = new Request('http://localhost:3000/api/status/track?q=1042');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.entry_checklist).toBeDefined();
    expect(Array.isArray(json.equipment_photos)).toBe(true);
  });
});
