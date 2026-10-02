'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

/**
 * QR code gerado 100% no navegador (lib `qrcode`), sem chamada a
 * API externa. Antes disso, telefone de cliente e dados de PIX
 * (valor, descrição, às vezes número da OS) saíam pro
 * api.qrserver.com só pra desenhar a imagem — desnecessário e
 * expõe dado de cliente a um terceiro sem motivo.
 */
export function QRCodeImage({
  value,
  size = 256,
  alt,
  className,
}: {
  value: string;
  size?: number;
  alt: string;
  className?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const renderWidth = Math.max(size, 256);
    QRCode.toDataURL(value, {
      width: renderWidth,
      margin: 1,
      errorCorrectionLevel: 'L',
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center border border-zinc-200 bg-zinc-100 font-mono text-xs text-zinc-500 ${className ?? ''}`}
        style={{ width: size, height: size }}
      >
        Gerando…
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={dataUrl}
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ imageRendering: 'pixelated' }}
    />
  );
}
