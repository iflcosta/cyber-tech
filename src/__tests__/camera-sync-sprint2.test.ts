import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { GET, POST } from '@/app/api/camera-sync/route';

describe('Sprint 2: Motor de Check-in em <60s & Cyber Camera Sync (Opção 1)', () => {
  it('rejeita token inválido ou curto demais na API /api/camera-sync', async () => {
    const req = new NextRequest('http://localhost:3000/api/camera-sync?token=123');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('inicializa sessão, adiciona fotos em tempo real, remove foto e conclui captura via /api/camera-sync', async () => {
    const token = `sync_test_${Date.now()}`;

    // 1. Inicializa sessão
    const initReq = new NextRequest('http://localhost:3000/api/camera-sync', {
      method: 'POST',
      body: JSON.stringify({ token, action: 'init' }),
    });
    const initRes = await POST(initReq);
    expect(initRes.status).toBe(200);
    const initData = await initRes.json();
    expect(initData.session_token).toBe(token);
    expect(initData.photos).toEqual([]);
    expect(initData.status).toBe('active');

    // 2. Celular envia Foto 1 (Frente) e Foto 2 (Traseira/S/N)
    const add1 = await POST(
      new NextRequest('http://localhost:3000/api/camera-sync', {
        method: 'POST',
        body: JSON.stringify({
          token,
          action: 'add_photo',
          photoUrl: 'https://cyberinformatica.tech/photos/front.jpg',
        }),
      }),
    );
    expect(add1.status).toBe(200);

    const add2 = await POST(
      new NextRequest('http://localhost:3000/api/camera-sync', {
        method: 'POST',
        body: JSON.stringify({
          token,
          action: 'add_photo',
          photoUrl: 'https://cyberinformatica.tech/photos/back-sn.jpg',
        }),
      }),
    );
    const add2Data = await add2.json();
    expect(add2Data.photos).toHaveLength(2);
    expect(add2Data.photos).toContain('https://cyberinformatica.tech/photos/front.jpg');
    expect(add2Data.photos).toContain('https://cyberinformatica.tech/photos/back-sn.jpg');

    // 3. PC do Balcão consulta a sessão e recebe as 2 fotos sincronizadas
    const getRes = await GET(
      new NextRequest(`http://localhost:3000/api/camera-sync?token=${token}`),
    );
    const getData = await getRes.json();
    expect(getData.photos).toHaveLength(2);

    // 4. Finaliza captura no celular
    const completeRes = await POST(
      new NextRequest('http://localhost:3000/api/camera-sync', {
        method: 'POST',
        body: JSON.stringify({ token, action: 'complete' }),
      }),
    );
    const completeData = await completeRes.json();
    expect(completeData.status).toBe('completed');
  });

  it('verifica que a rota mobile /camera-sync/[token] e o CameraSyncModal estão implementados com slots guiados', () => {
    const mobilePagePath = path.resolve(
      process.cwd(),
      'src/app/camera-sync/[token]/page.tsx',
    );
    const modalPath = path.resolve(
      process.cwd(),
      'src/app/admin/os/new/CameraSyncModal.tsx',
    );
    const newOsFormPath = path.resolve(
      process.cwd(),
      'src/app/admin/os/new/NewOSForm.tsx',
    );

    expect(fs.existsSync(mobilePagePath)).toBe(true);
    expect(fs.existsSync(modalPath)).toBe(true);
    expect(fs.existsSync(newOsFormPath)).toBe(true);

    const mobileCode = fs.readFileSync(mobilePagePath, 'utf-8');
    expect(mobileCode).toContain('1. Frente / Tela');
    expect(mobileCode).toContain('2. Traseira / Etiqueta S/N');
    expect(mobileCode).toContain('3. Laterais / Conectores / Avarias');

    const formCode = fs.readFileSync(newOsFormPath, 'utf-8');
    expect(formCode).toContain('QUICK_SYMPTOM_CHIPS');
    expect(formCode).toContain('Cyber Camera Sync (QR Code)');
    expect(formCode).toContain('Criar OS + Etiqueta 58mm');
  });
});
