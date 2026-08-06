'use client';

/**
 * Cliente do agente de impressão local (ver print-agent/ na raiz do
 * repo). O agente roda no PC da bancada, ouvindo em localhost, e
 * repassa os bytes ESC/POS pra porta serial/Bluetooth da impressora.
 *
 * localhost é uma origem "potencialmente confiável" (secure context)
 * mesmo sem HTTPS — o navegador permite uma página HTTPS (o site em
 * produção) chamar http://localhost sem bloquear como conteúdo misto.
 * É o mesmo padrão usado por sistemas de PDV reais (ex: QZ Tray).
 */

const STORAGE_KEY = 'cybererp_print_agent_url';
const DEFAULT_URL = 'http://localhost:9100';

export function getPrintAgentUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_URL;
  return window.localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
}

export function setPrintAgentUrl(url: string) {
  window.localStorage.setItem(STORAGE_KEY, url.trim().replace(/\/+$/, ''));
}

export type PrintResult = { ok: true } | { ok: false; error: string };

export async function sendToPrintAgent(bytes: Uint8Array): Promise<PrintResult> {
  const url = getPrintAgentUrl();
  try {
    const res = await fetch(`${url}/print`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: new Blob([bytes as BlobPart]),
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { ok: false, error: body || `Agente respondeu ${res.status}` };
    }
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: `Não consegui falar com o agente de impressão em ${url}. Ele está aberto no PC da bancada?`,
    };
  }
}

export async function checkPrintAgentStatus(): Promise<PrintResult> {
  const url = getPrintAgentUrl();
  try {
    const res = await fetch(`${url}/status`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return { ok: false, error: `Agente respondeu ${res.status}` };
    return { ok: true };
  } catch {
    return { ok: false, error: `Agente não encontrado em ${url}` };
  }
}
