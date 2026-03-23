import { useState, useEffect } from 'react';
import { getOrCreateSessionVoucher, getSessionVoucher } from '../lib/session/voucherSession';

export function useVoucherSession() {
    const [voucherCode, setVoucherCode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const initializeVoucher = async () => {
        setIsLoading(true);
        try {
            const code = await getOrCreateSessionVoucher();
            setVoucherCode(code);
            return code;
        } catch (error) {
            console.error('Failed to initialize session voucher:', error);
            // Fallback just in case
            const code = getSessionVoucher();
            setVoucherCode(code);
            return code;
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // We stopped calling initializeVoucher on mount to avoid "phantom" leads
        // in the database. Vouchers are now created on-demand when interaction happens.
        // initializeVoucher(); 
        
        // However, we still check if there's an existing one in session storage to keep UI consistent
        const existing = getSessionVoucher();
        if (existing) {
            setVoucherCode(existing);
            setIsLoading(false);
        } else {
            setIsLoading(false); // No voucher in session, but we stay "idle"
        }
    }, []);

    return {
        voucherCode,
        isLoading,
        refreshVoucher: initializeVoucher
    };
}
