'use client';

import { useMemo, useState } from 'react';
import { buildPixBRCode, PIX_CONFIG } from '@/app/admin/lib/pix';
import { QRCodeImage } from './QRCode';

export interface PixQRButtonProps {
  defaultAmount?: number;       // valor sugerido em R$
  txid?: string;                 // identificador (ex: numero da OS)
  customerName?: string;         // pro cliente saber pra que é o pagamento
  description?: string;          // descricao da transacao
  buttonLabel?: string;          // customizar texto do botao
  buttonClassName?: string;      // customizar estilo
}

export function PixQRButton({
  defaultAmount,
  txid,
  customerName,
  description,
  buttonLabel = 'Gerar PIX QR',
  buttonClassName,
}: PixQRButtonProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>(
    defaultAmount ? defaultAmount.toFixed(2).replace('.', ',') : '',
  );
  const [desc, setDesc] = useState(description ?? '');

  const amountNum = (() => {
    const clean = amount.trim().replace(/[R$\s]/g, '');
    if (!clean) return 0;
    const normalized = clean.includes(',')
      ? clean.replace(/\./g, '').replace(',', '.')
      : clean;
    return Number(normalized) || 0;
  })();

  const brCode = useMemo(
    () => buildPixBRCode({ amount: amountNum > 0 ? amountNum : undefined, txid, description: desc }),
    [amountNum, txid, desc],
  );

  function copyCode() {
    navigator.clipboard.writeText(brCode).then(
      () => alert('Código PIX (copia e cola) copiado!'),
      () => alert('Erro ao copiar. Tente selecionar manualmente.'),
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          buttonClassName ??
          'inline-flex items-center gap-2 rounded-md bg-black px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800'
        }
      >
        💰 {buttonLabel}
      </button>

      {open && !PIX_CONFIG.key && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Chave PIX não configurada (env var <code className="font-mono text-xs">NEXT_PUBLIC_PIX_KEY</code> vazia). Configure no Vercel pra esse QR code funcionar.
        </div>
      )}

      {open && PIX_CONFIG.key && (
        <div className="rounded-md border border-zinc-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-1">
              <QRCodeImage
                value={brCode}
                size={200}
                alt="QR Code PIX"
                className="rounded border border-zinc-200"
              />
              <p className="text-[10px] text-zinc-500">QR Code PIX</p>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium text-zinc-700">
                Cliente escaneia com o app do banco pra pagar.
              </p>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Valor (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00 (deixe vazio pra valor aberto)"
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={customerName ? `Pagamento OS - ${customerName}` : 'Pagamento OS'}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <button
                type="button"
                onClick={copyCode}
                className="w-full rounded-md border border-slate-300 bg-slate-50 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                📋 Copiar código PIX (copia e cola)
              </button>

              <details className="text-[10px] text-slate-500">
                <summary className="cursor-pointer">Ver código bruto</summary>
                <pre className="mt-1 max-h-20 overflow-auto break-all rounded bg-slate-50 p-1 font-mono text-[9px]">
{brCode}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Versão inline (sem botão - ja fica aberto). Pra usar dentro do recibo impresso.
export function PixQRInline({ amount, txid, description }: { amount?: number; txid?: string; description?: string }) {
  const brCode = useMemo(
    () => buildPixBRCode({ amount, txid, description }),
    [amount, txid, description],
  );
  if (!PIX_CONFIG.key) return null; // sem chave configurada, nao gera QR quebrado
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-slate-200 bg-white p-2">
      <QRCodeImage value={brCode} size={140} alt="QR PIX" className="rounded" />
      <p className="text-[9px] text-slate-500">Pagar com PIX</p>
      <p className="text-[9px] font-mono text-slate-600">Chave: {PIX_CONFIG.key}</p>
    </div>
  );
}