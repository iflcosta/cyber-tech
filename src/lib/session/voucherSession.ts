import { generateVoucherCode } from '../voucher';

export interface CreateVoucherParams {
    marketing_source?: string;
    utm_parameters?: any;
}

/**
 * Reads the voucher from sessionStorage
 */
export function getSessionVoucher(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem('cyber_voucher');
}

/**
 * Saves the voucher and its creation timestamp to sessionStorage
 */
export function setSessionVoucher(code: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('cyber_voucher', code);
    sessionStorage.setItem('cyber_voucher_ts', new Date().getTime().toString());
}

/**
 * Clears the voucher from sessionStorage
 */
export function clearSessionVoucher(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem('cyber_voucher');
    sessionStorage.removeItem('cyber_voucher_ts');
}

/**
 * Validates if a voucher exists and is less than 24h old
 */
export function isSessionVoucherValid(): boolean {
    if (typeof window === 'undefined') return false;
    
    const voucher = sessionStorage.getItem('cyber_voucher');
    const ts = sessionStorage.getItem('cyber_voucher_ts');
    
    if (!voucher || !ts) return false;
    
    const now = new Date().getTime();
    const age = now - parseInt(ts);
    const dayInMs = 24 * 60 * 60 * 1000;
    
    if (age > dayInMs) {
        clearSessionVoucher();
        return false;
    }
    
    return true;
}

/**
 * Retrieves the valid session voucher or generates one locally.
 * We intentionally do NOT call the API here to avoid creating phantom
 * maintenance_orders records for every page visit or WhatsApp click.
 * The voucher is persisted in Supabase only when the user submits a
 * real form (maintenance, lead modal, etc.).
 */
export async function getOrCreateSessionVoucher(_params: CreateVoucherParams = {}): Promise<string> {
    if (typeof window === 'undefined') return '';

    if (isSessionVoucherValid()) {
        const code = getSessionVoucher();
        if (code) return code;
    }

    const code = generateVoucherCode();
    setSessionVoucher(code);
    return code;
}
