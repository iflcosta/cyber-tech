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
          'inline-flex items-center gap-2 border border-zinc-950 bg-black px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider text-white shadow-xs hover:bg-zinc-800 cursor-pointer'
        }
      >
        💰 {buttonLabel}
      </button>

      {open && !PIX_CONFIG.key && (
        <div className="border border-amber-300 bg-amber-50 p-3 font-mono text-xs text-amber-800">
          Chave PIX não configurada (env var <code>NEXT_PUBLIC_PIX_KEY</code> vazia). Configure no Vercel pra esse QR code funcionar.
        </div>
      )}

      {open && PIX_CONFIG.key && (
        <div className="border-2 border-zinc-950 bg-white p-4 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start font-mono">
            <div className="flex flex-col items-center gap-1">
              <QRCodeImage
                value={brCode}
                size={200}
                alt="QR Code PIX"
                className="border-2 border-zinc-950 bg-white p-1"
              />
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">QR Code PIX</p>
            </div>
            <div className="flex-1 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-950">
                Cliente escaneia com o app do banco pra pagar.
              </p>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Valor (R$)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0,00 (deixe vazio pra valor aberto)"
                  className="mt-1 block w-full border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                  Descrição (opcional)
                </label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder={customerName ? `Pagamento OS - ${customerName}` : 'Pagamento OS'}
                  className="mt-1 block w-full border border-zinc-300 bg-white px-2.5 py-1.5 font-mono text-xs text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-950 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={copyCode}
                className="w-full border-2 border-zinc-950 bg-white px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-wider text-zinc-950 hover:bg-zinc-100 transition cursor-pointer"
              >
                📋 Copiar código PIX (copia e cola)
              </button>

              <details className="text-[10px] text-zinc-500">
                <summary className="cursor-pointer font-bold uppercase tracking-wider">Ver código bruto</summary>
                <pre className="mt-1 max-h-20 overflow-auto break-all border border-zinc-300 bg-zinc-50 p-2 font-mono text-[9px] text-zinc-800">
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
    <div className="flex flex-col items-center gap-1 border-2 border-zinc-950 bg-white p-2.5 font-mono">
      <QRCodeImage value={brCode} size={140} alt="QR PIX" className="border border-zinc-950" />
      <p className="text-[10px] font-bold uppercase text-zinc-950">Pagar com PIX</p>
      <p className="text-[10px] text-zinc-600">Chave: {PIX_CONFIG.key}</p>
    </div>
  );
}