import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { brand } from '@/lib/brand';
import { getOrCreateSessionVoucher, setSessionVoucher } from '@/lib/session/voucherSession';
import { trackLead } from '@/lib/leads';

interface WhatsAppLeadParams {
    intent?: string;
    description?: string;
    messageTemplate?: string;
}

export function useWhatsAppLead() {
    const searchParams = useSearchParams();

    // Intercepta ?voucher= na URL e salva na sessão.
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const utmVoucher = searchParams.get('voucher');
            if (utmVoucher && utmVoucher.startsWith('BPC-')) {
                setSessionVoucher(utmVoucher);
            }
        }
    }, [searchParams]);

    /**
     * Função unificada para abrir o WhatsApp.
     * Ela garante que o voucher da sessão atual seja o utilizado, criando um caso não exista.
     */
    const openWhatsAppLead = async ({ intent = 'duvida_tecnica', description = '', messageTemplate }: WhatsAppLeadParams = {}) => {
        // 1. Pega ou cria o voucher da sessão
        const voucher = await getOrCreateSessionVoucher();

        // 2. Se for uma intenção específica ou tiver descrição da página/produto, fazemos um upsert
        // silencioso opcional via trackLead. O trackLead em src/lib/leads.ts fará o trabalho pesado
        // graças ao onConflict: 'voucher_code'.
        try {
            await trackLead({
                voucher_code: voucher,
                intent_type: intent,
                description: description || 'Clique de redirecionamento genérico',
                interest_type: intent.includes('manutencao') ? 'manutencao' : 'venda',
                client_name: 'Lead Direto (WhatsApp)',
                whatsapp: '00000000000' // Stub since we don't have it yet, or we leave it empty if db allows
            });
        } catch(e) { /* silent catch */ }

        // 3. Monta a mensagem final e redireciona.
        const defaultMessage = `Olá! Salvei o voucher *${voucher}* e gostaria de atendimento.`;
        const text = messageTemplate ? messageTemplate.replace('{voucher}', voucher) : defaultMessage;

        window.open(`https://wa.me/${brand.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
    };

    return {
        openWhatsAppLead
    };
}
