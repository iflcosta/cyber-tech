'use client';

import { useState } from 'react';

// Normaliza telefone BR para wa.me
// Aceita formatos: (11) 99999-9999, 11 999999999, +5511999999999, 11999999999
function toWhatsAppLink(phone: string | null | undefined, message?: string): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  // Se nao tem 55 no inicio, adiciona (BR padrao)
  const withCountry = digits.startsWith('55') && digits.length >= 12
    ? digits
    : '55' + digits;
  const base = `https://wa.me/${withCountry}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function WhatsAppButton({
  phone,
  customerName,
  context,
}: {
  phone: string | null | undefined;
  customerName?: string;
  context?: 'os' | 'sale';
}) {
  const [showQR, setShowQR] = useState(false);
  const [message, setMessage] = useState('');

  const link = toWhatsAppLink(phone);

  if (!link) {
    return (
      <p className="text-xs text-slate-500 italic">Sem telefone cadastrado.</p>
    );
  }

  const defaultMsg = context === 'os'
    ? `Ola ${customerName ?? ''}! Aqui e da Cyber Informatica. Tudo bem?`
    : context === 'sale'
    ? `Ola ${customerName ?? ''}! Obrigado pela compra na Cyber Informatica.`
    : `Ola ${customerName ?? ''}! Aqui e da Cyber Informatica.`;

  const finalLink = (message.trim()
    ? toWhatsAppLink(phone, message.trim())
    : toWhatsAppLink(phone, defaultMsg)) ?? link;

  // QR code via API publica (sem dependencia externa)
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(finalLink)}`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <a
          href={finalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <WhatsAppIcon /> WhatsApp
        </a>
        <button
          type="button"
          onClick={() => setShowQR((v) => !v)}
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {showQR ? 'Ocultar QR' : 'Mostrar QR'}
        </button>
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ligar
          </a>
        )}
      </div>

      {showQR && (
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR Code para abrir WhatsApp"
              width={140}
              height={140}
              className="rounded border border-slate-200"
            />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium text-slate-700">
                Escaneie com a camera do celular pra abrir o WhatsApp direto.
              </p>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={defaultMsg}
                rows={3}
                className="block w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-slate-500">
                O texto acima sera enviado como primeira mensagem (opcional).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}