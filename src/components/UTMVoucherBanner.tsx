'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { X, MessageSquare, Tag } from 'lucide-react';
import { getOrCreateSessionVoucher } from '@/lib/session/voucherSession';
import { useWhatsAppLead } from '@/hooks/useWhatsAppLead';

/**
 * Aparece automaticamente quando o visitante chega via link com UTM
 * (ex: Google Ads, Instagram, WhatsApp Status).
 *
 * Fluxo:
 *   1. Detecta utm_source na URL
 *   2. Gera o voucher localmente (sessionStorage) — sem chamar o banco ainda
 *   3. Exibe banner no rodapé com o código e botão de WhatsApp
 *   4. Ao clicar em "Usar no WhatsApp" → trackLead é chamado e abre o chat
 */
export default function UTMVoucherBanner() {
    const searchParams = useSearchParams();
    const [voucher, setVoucher] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const { isLoading, openWhatsApp } = useWhatsAppLead({ serviceType: 'outro' });

    useEffect(() => {
        const utmSource = searchParams.get('utm_source');
        if (!utmSource) return;

        // Se já foi dispensado nesta sessão, não reexibe
        if (sessionStorage.getItem('utm_banner_dismissed')) return;

        getOrCreateSessionVoucher().then(code => setVoucher(code));
    }, [searchParams]);

    const handleDismiss = () => {
        sessionStorage.setItem('utm_banner_dismissed', '1');
        setDismissed(true);
    };

    const handleWhatsApp = () => {
        if (!voucher) return;
        openWhatsApp(
            `Olá! Vim pelo anúncio e meu voucher é *${voucher}*. Pode me atender?`,
            'outro'
        );
    };

    if (!voucher || dismissed) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[98] bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
            <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">

                {/* Voucher info */}
                <div className="flex items-center gap-3 min-w-0">
                    <Tag size={14} className="text-[var(--accent-primary)] shrink-0" />
                    <span className="text-[9px] font-mono text-[var(--text-muted)] uppercase tracking-widest shrink-0 hidden sm:block">
                        Seu voucher
                    </span>
                    <span className="font-mono font-bold text-sm tracking-[0.15em] text-[var(--text-primary)]">
                        {voucher}
                    </span>
                    <span className="text-[8px] font-mono text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded px-1.5 py-0.5 hidden sm:block">
                        desconto garantido
                    </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={handleWhatsApp}
                        disabled={isLoading}
                        className="flex items-center gap-2 bg-[var(--accent-primary)] text-white text-[10px] font-display font-bold uppercase tracking-wider px-4 py-2.5 rounded transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                    >
                        <MessageSquare size={13} />
                        <span>{isLoading ? 'Aguarde...' : 'Usar no WhatsApp'}</span>
                    </button>
                    <button
                        onClick={handleDismiss}
                        aria-label="Fechar"
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <X size={15} />
                    </button>
                </div>
            </div>
        </div>
    );
}
