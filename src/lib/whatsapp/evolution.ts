/**
 * Evolution API WhatsApp Provider.
 *
 * Envia mensagens de WhatsApp de forma automatizada e com custo zero
 * utilizando a instância da Evolution API (baseada em Baileys) hospedada
 * na VPS própria da Cyber Informática.
 */

import type { WhatsAppProvider, SendResult } from './types';

export class EvolutionProvider implements WhatsAppProvider {
  private apiUrl: string;
  private apiKey: string;
  private instanceName: string;

  constructor(apiUrl: string, apiKey: string, instanceName = 'cyber-tech') {
    // Remove barra final se houver
    this.apiUrl = apiUrl.replace(/\/+$/, '');
    this.apiKey = apiKey;
    this.instanceName = instanceName;
  }

  /**
   * Normaliza número brasileiro para o padrão E.164 limpo (ex: 5511999998888)
   */
  private normalizePhone(phone: string): string {
    let clean = phone.replace(/\D/g, '');

    // Se começar com 0 (ex: 0119...), remove o 0 inicial
    if (clean.startsWith('0')) {
      clean = clean.slice(1);
    }

    // Se tiver 10 ou 11 dígitos (DDD + número), adiciona o DDI 55 do Brasil
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean;
    }

    return clean;
  }

  async send(to: string, message: string): Promise<SendResult> {
    const cleanNumber = this.normalizePhone(to);
    const timestamp = new Date().toISOString();

    if (!cleanNumber || cleanNumber.length < 10) {
      throw new Error(`[Evolution API] Número de telefone inválido: "${to}"`);
    }

    const endpoint = `${this.apiUrl}/message/sendText/${encodeURIComponent(this.instanceName)}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          number: cleanNumber,
          text: message,
          options: {
            delay: 1000,
            presence: 'composing',
            linkPreview: true,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[Evolution API] Erro HTTP ${response.status} ao enviar para ${cleanNumber}:`,
          errorText,
        );
        throw new Error(
          `Evolution API retornou status ${response.status}: ${errorText.slice(0, 150)}`,
        );
      }

      const data = await response.json();
      const messageId =
        data?.key?.id ||
        data?.messageId ||
        `evo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

      console.log(`[Evolution API] Mensagem enviada com sucesso para ${cleanNumber} (ID: ${messageId})`);

      return {
        success: true,
        messageId,
        timestamp,
      };
    } catch (err) {
      console.error(`[Evolution API] Falha no disparo de WhatsApp para ${cleanNumber}:`, err);
      throw err;
    }
  }
}
