'use client';

import { useState, useEffect, useCallback } from 'react';

interface ConnectionInfo {
  connected: boolean;
  status: string;
  instance: string;
  vpsHost: string;
  error?: string;
}

export default function WhatsAppAdminPage() {
  const [conn, setConn] = useState<ConnectionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Teste de conexão da VPS Cyber Informática!');
  const [testResult, setTestResult] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setConn(data);
      if (data.connected) {
        setQrCodeBase64(null);
      }
    } catch (e) {
      setConn({
        connected: false,
        status: 'error',
        instance: 'cyber-loja',
        vpsHost: '148.113.247.44:8085',
        error: (e as Error).message,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  async function requestQRCode() {
    setActionLoading(true);
    setQrCodeBase64(null);
    try {
      const res = await fetch('/api/whatsapp/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect' }),
      });
      const data = await res.json();
      if (data.base64) {
        setQrCodeBase64(data.base64);
      } else if (data.qrcode?.base64) {
        setQrCodeBase64(data.qrcode.base64);
      }
      if (data.pairingCode) {
        setPairingCode(data.pairingCode);
      }
    } catch (err) {
      alert(`Erro ao gerar QR Code: ${(err as Error).message}`);
    } finally {
      setActionLoading(false);
    }
  }

  async function sendTestMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!testPhone.trim()) return;
    setTestResult('Enviando...');
    try {
      const res = await fetch('/api/whatsapp/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerPhone: testPhone,
          customerName: 'Cliente Teste',
          osNumber: '9999',
          osId: 'test-id',
          status: 'ready',
          equipmentBrand: 'Notebook',
          equipmentModel: 'Asus Vivobook',
          amount: 250,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult('✅ Mensagem enviada com sucesso pela VPS!');
      } else {
        setTestResult(`❌ Erro no envio: ${data.error || 'Falha desconhecida'}`);
      }
    } catch (err) {
      setTestResult(`❌ Erro: ${(err as Error).message}`);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Automação de WhatsApp · VPS Cyber
          </h1>
          <p className="text-xs text-slate-500">
            Disparos automáticos de status de OS, orçamento e retirada via Evolution API v2 na sua VPS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="http://148.113.247.44:8085/manager"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <span>⚙️ Painel Evolution VPS</span>
          </a>
          <button
            type="button"
            onClick={checkStatus}
            disabled={loading}
            className="rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-sky-700 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Checando…' : '🔄 Atualizar Status'}
          </button>
        </div>
      </div>

      {/* Card de Status da Conexão */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full text-lg ${
                conn?.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              {conn?.connected ? '✓' : '⚠️'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  {conn?.connected ? 'WhatsApp da Loja Conectado' : 'WhatsApp Desconectado'}
                </h2>
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase ${
                    conn?.connected
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {conn?.status || 'desconhecido'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                VPS: 148.113.247.44:8085 · Instância: {conn?.instance || 'cyber-loja'}
              </p>
            </div>
          </div>

          {!conn?.connected && (
            <button
              type="button"
              onClick={requestQRCode}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
            >
              <span>{actionLoading ? 'Gerando…' : '📱 Gerar QR Code para Conectar'}</span>
            </button>
          )}
        </div>

        {/* QR Code Container */}
        {qrCodeBase64 && !conn?.connected && (
          <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50/50 p-6 text-center">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-900 mb-2">
              Aponte o WhatsApp da Loja para este QR Code
            </h3>
            <p className="text-xs text-slate-600 mb-4 max-w-sm mx-auto">
              Abra o WhatsApp no celular da loja ➔ <strong>Aparelhos Conectados</strong> ➔ <strong>Conectar Aparelho</strong>
            </p>
            <div className="inline-block p-4 bg-white rounded-xl border border-slate-200 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeBase64.startsWith('data:') ? qrCodeBase64 : `data:image/png;base64,${qrCodeBase64}`}
                alt="QR Code WhatsApp"
                className="w-64 h-64 mx-auto"
              />
            </div>
            {pairingCode && (
              <div className="mt-4">
                <span className="text-xs text-slate-500 block mb-1">Ou use o Código de Pareamento:</span>
                <code className="text-base font-bold font-mono bg-white px-3 py-1.5 rounded-md border border-slate-300 text-slate-900">
                  {pairingCode}
                </code>
              </div>
            )}
            <p className="mt-3 text-[11px] text-slate-500 font-mono">
              O QR Code expira em 40 segundos. Se expirar, clique novamente em &quot;Gerar QR Code&quot;.
            </p>
          </div>
        )}
      </div>

      {/* Disparos de Teste */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-1">
          🧪 Testar Disparo via VPS
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Envie uma mensagem simulada de aviso de OS para conferir a entrega em tempo real.
        </p>

        <form onSubmit={sendTestMessage} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Telefone com DDD (Ex: 11999999999)
            </label>
            <input
              type="tel"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              placeholder="11999999999"
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-sky-600 focus:outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={!conn?.connected}
            className="rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:bg-zinc-800 transition disabled:opacity-40 cursor-pointer"
          >
            Disparar Mensagem de Teste
          </button>

          {testResult && (
            <p className="text-xs font-semibold text-slate-800 p-2.5 rounded-md bg-slate-50 border border-slate-200">
              {testResult}
            </p>
          )}
        </form>
      </div>

      {/* Dossiê de Credenciais & Segurança */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 uppercase tracking-wider font-mono">
          🔐 Dados de Infraestrutura & Segurança da VPS
        </h4>
        <p>
          • <strong>Host:</strong> <code>148.113.247.44:8085</code> (Evolution API v2.2.0 em Docker com PostgreSQL & Redis dedicado)
        </p>
        <p>
          • <strong>API Key Mestra:</strong> <code>cyber_wa_sec_2026_braganca_ifl</code>
        </p>
        <p>
          • <strong>Painel Web do Manager:</strong>{' '}
          <a
            href="http://148.113.247.44:8085/manager"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 underline font-semibold"
          >
            http://148.113.247.44:8085/manager
          </a>
        </p>
      </div>
    </div>
  );
}
