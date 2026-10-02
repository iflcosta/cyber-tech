import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EvolutionProvider } from '@/lib/whatsapp/evolution';

describe('EvolutionProvider', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('normalizes Brazilian phone numbers properly and sends payload', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ key: { id: 'evo_msg_123' } }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.fetch = fetchMock as any;

    const provider = new EvolutionProvider(
      'https://whatsapp.cyberinformatica.tech',
      'secret-evo-key',
      'cyber-tech',
    );

    const result = await provider.send('(11) 98765-4321', 'Olá, sua OS está pronta!');

    expect(result.success).toBe(true);
    expect(result.messageId).toBe('evo_msg_123');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://whatsapp.cyberinformatica.tech/message/sendText/cyber-tech',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: 'secret-evo-key',
        },
        body: JSON.stringify({
          number: '5511987654321',
          text: 'Olá, sua OS está pronta!',
          options: {
            delay: 1000,
            presence: 'composing',
            linkPreview: true,
          },
        }),
      }),
    );
  });

  it('throws error when Evolution API returns non-ok status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Instance not connected',
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.fetch = fetchMock as any;

    const provider = new EvolutionProvider('http://localhost:8080', 'key', 'loja');

    await expect(provider.send('11999998888', 'teste')).rejects.toThrow(
      'Evolution API retornou status 400: Instance not connected',
    );
  });
});
