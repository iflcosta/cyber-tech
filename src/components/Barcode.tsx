'use client';

import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'CODE39' | 'ITF';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  className?: string;
}

export function Barcode({
  value,
  format,
  width = 1.8,
  height = 40,
  displayValue = true,
  fontSize = 11,
  className = '',
}: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    // Detect format automatically if not specified
    let selectedFormat = format;
    if (!selectedFormat) {
      const cleanDigits = value.replace(/\D/g, '');
      if (cleanDigits.length === 13 && cleanDigits === value) {
        selectedFormat = 'EAN13';
      } else {
        selectedFormat = 'CODE128';
      }
    }

    try {
      JsBarcode(svgRef.current, value, {
        format: selectedFormat,
        width,
        height,
        displayValue,
        font: 'monospace',
        fontSize,
        textMargin: 2,
        margin: 2,
        background: '#ffffff',
        lineColor: '#000000',
      });
    } catch {
      // Fallback to CODE128 if EAN13 checksum fails or invalid length
      try {
        if (svgRef.current) {
          JsBarcode(svgRef.current, value, {
            format: 'CODE128',
            width,
            height,
            displayValue,
            font: 'monospace',
            fontSize,
            textMargin: 2,
            margin: 2,
            background: '#ffffff',
            lineColor: '#000000',
          });
        }
      } catch (err2) {
        console.warn('Falha ao renderizar código de barras:', err2);
      }
    }
  }, [value, format, width, height, displayValue, fontSize]);

  if (!value) return null;

  return (
    <div className={`flex justify-center ${className}`}>
      <svg ref={svgRef} className="max-w-full" />
    </div>
  );
}
