'use client';

import { useMemo, useState } from 'react';
import { buildPixBRCode, PIX_CONFIG } from '@/app/admin/crm/lib/pix';

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

  const amountNum = Number(amount.replace(/\./g, '').replace(',', '.')) || 0;

  const brCode = useMemo(
    () => buildPixBRCode({ amount: amountNum > 0 ? amountNum : undefined, txid, description: desc }),
    [amountNum, txid, desc],
  );

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(brCode)}`;

  function copyCode() {
    navigator.clipboard.writeText(brCode).then(
      () => alert('Codigo PIX (copia e cola) copiado!'),
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
          'inline-flex items-center gap-2 rounded-md bg-teal-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700'
        }
      >
        💰 {buttonLabel}
      </button>

      {open && (
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR Code PIX"
                width={200}
                height={200}
                className="rounded border border-slate-200"
              />
              <p className="text-[10px] text-slate-500">QR Code PIX</p>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium text-slate-700">
                Cliente escaneia com o app do banco pra pagar.
              </p>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Valor (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00 (deixe vazio pra valor aberto)"
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={customerName ? `Pagamento OS - ${customerName}` : 'Pagamento OS'}
                  className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=5&data=${encodeURIComponent(brCode)}`;
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-slate-200 bg-white p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={qrUrl} alt="QR PIX" width={140} height={140} className="rounded" />
      <p className="text-[9px] text-slate-500">Pagar com PIX</p>
      <p className="text-[9px] font-mono text-slate-600">Chave: {PIX_CONFIG.key}</p>
    </div>
  );
}