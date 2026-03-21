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
        } catch (error) {
            console.error('Failed to initialize session voucher:', error);
            // Fallback just in case
            setVoucherCode(getSessionVoucher());
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        initializeVoucher();
    }, []);

    return {
        voucherCode,
        isLoading,
        refreshVoucher: initializeVoucher
    };
}
