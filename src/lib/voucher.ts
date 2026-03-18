import { brand } from './brand';

/**
 * Generates a unique voucher code in the format BPC-XXXX
 * Uses a character set without ambiguous characters (e.g., O/0, I/1)
 */
export function generateVoucher(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const code = Array.from(
    { length: brand.voucher.length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `${brand.voucher.prefix}-${code}`;
}
