// ============================================================
// Gerador de PIX BR Code (EMV QRCPS)
// Spec: https://www.bcb.gov.br/estabilidadefinanceira/pix
// ============================================================

// Configuracao da loja — vem de env var (não hardcoded) porque a
// chave é um CPF real. Mostrar num QR code pro cliente pagar é o uso
// normal e esperado (chave PIX não é segredo nesse sentido — igual a
// mostrar uma conta bancária), mas deixar o CPF cru, permanentemente
// buscável no código-fonte do repositório, é diferente disso. Usa
// NEXT_PUBLIC_ porque PixQRButton roda no navegador (o valor ainda
// vai aparecer no bundle final — isso é inerente a mostrar a chave
// pro cliente pagar, não dá pra evitar).
export const PIX_CONFIG = {
  key: process.env.NEXT_PUBLIC_PIX_KEY ?? '',
  merchantName: process.env.NEXT_PUBLIC_PIX_MERCHANT_NAME ?? 'CYBER INFORMATICA', // max 25 chars sem acento
  merchantCity: process.env.NEXT_PUBLIC_PIX_MERCHANT_CITY ?? 'BRAGANCA PTA',       // max 15 chars sem acento
} as const;

// TLV (Tag-Length-Value) builder
function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0');
  return id + len + value;
}

// CRC16-CCITT (XMODEM) - polinomio 0x1021, init 0xFFFF
function crc16ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Normaliza string para PIX (sem acento, ASCII)
function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z0-9 ]/gi, '').toUpperCase();
}

export interface PixOptions {
  amount?: number;          // em reais, opcional (QR estatico se omitido)
  txid?: string;            // identificador da transacao (max 25 chars), opcional
  description?: string;     // descricao visivel pro cliente (max 50 chars), opcional
}

export function buildPixBRCode(opts: PixOptions = {}): string {
  const key = PIX_CONFIG.key;
  const merchantName = normalize(PIX_CONFIG.merchantName).substring(0, 25);
  const merchantCity = normalize(PIX_CONFIG.merchantCity).substring(0, 15);

  // Merchant Account Information (PIX)
  const gui = tlv('00', 'br.gov.bcb.pix');
  const keyField = tlv('01', key);
  const descField = opts.description
    ? tlv('02', normalize(opts.description).substring(0, 50))
    : '';
  const merchantAccount = tlv('26', gui + keyField + descField);

  // Transaction Amount (opcional)
  const amountField = opts.amount && opts.amount > 0
    ? tlv('54', opts.amount.toFixed(2))
    : '';

  // Additional Data Field (txid)
  // Gera txid aleatorio se nao informado
  const txid = opts.txid ?? `TX${Date.now().toString(36).toUpperCase()}`.substring(0, 25);
  const additionalData = tlv('62', tlv('05', normalize(txid).substring(0, 25)));

  // Payload completo SEM CRC
  const payload =
    tlv('00', '01') +          // Payload Format Indicator
    tlv('01', '12') +          // Point of Initiation Method (dynamic, reutilizavel)
    merchantAccount +         // Merchant Account Information (PIX)
    tlv('52', '0000') +        // Merchant Category Code
    tlv('53', '986') +         // Transaction Currency (BRL = 986)
    amountField +             // Transaction Amount (opcional)
    tlv('58', 'BR') +         // Country Code
    tlv('59', merchantName) + // Merchant Name
    tlv('60', merchantCity) + // Merchant City
    additionalData +          // Additional Data (txid)
    '6304';                   // CRC16 placeholder (4 chars)

  return payload + crc16ccitt(payload);
}