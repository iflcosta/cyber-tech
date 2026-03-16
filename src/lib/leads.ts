import { supabase } from './supabase';
import { createTinyOrder } from './tiny';

// Detecta a origem do lead via UTM params ou referrer
function detectMarketingSource(): string {
    if (typeof window === 'undefined') return 'direto';

    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');

    if (utmSource) {
        // Normaliza nomes comuns
        const src = utmSource.toLowerCase();
        if (src.includes('instagram') || src.includes('ig')) return 'instagram';
        if (src.includes('facebook') || src.includes('fb')) return 'facebook';
        if (src.includes('google') || src.includes('gads')) return 'google_ads';
        if (src.includes('whatsapp') || src.includes('wpp')) return 'whatsapp';
        if (src.includes('tiktok')) return 'tiktok';
        return utmMedium ? `${utmSource}/${utmMedium}` : utmSource;
    }

    const referrer = document.referrer;
    if (!referrer) return 'direto';
    if (referrer.includes('instagram.com')) return 'instagram';
    if (referrer.includes('facebook.com')) return 'facebook';
    if (referrer.includes('google.com')) return 'google_organico';
    if (referrer.includes('whatsapp.com')) return 'whatsapp';
    if (referrer.includes('tiktok.com')) return 'tiktok';
    return 'outros';
}

export const trackLead = async (data: {
    client_name?: string;
    whatsapp?: string;
    interest_type: 'venda' | 'manutencao' | 'voucher' | 'pc_build';
    description?: string;
    delivery_type?: 'store' | 'delivery';
    delivery_address?: string;
}) => {
    // Simples Session ID
    let sessionId = localStorage.getItem('cyber_session');
    if (!sessionId) {
        sessionId = 'SESS-' + Math.random().toString(36).substr(2, 9).toUpperCase();
        localStorage.setItem('cyber_session', sessionId);
    }

    // Detecta a origem de marketing
    const marketingSource = detectMarketingSource();

    // Voucher CYBER-XXXX
    const voucherCode = 'CYBER-' + Math.random().toString(36).substr(2, 4).toUpperCase();

    let tinyId = null;
    try {
        const order = await createTinyOrder({
            client_name: data.client_name || 'Cliente Site',
            whatsapp: data.whatsapp || 'Não informado',
            interest_type: data.interest_type,
            description: data.description || '',
            delivery_type: data.delivery_type,
            delivery_address: data.delivery_address
        });
        tinyId = order.id;
    } catch (e) {
        console.error("Falha ao criar pedido no Tiny ERP:", e);
    }

    const { error } = await supabase.from('leads').insert({
        client_name: data.client_name,
        whatsapp: data.whatsapp,
        interest_type: data.interest_type,
        voucher_code: voucherCode,
        description: data.description,
        status: 'pending',
        order_id_tiny: tinyId,
        marketing_source: marketingSource
    });

    if (error) {
        console.error("Erro detalhado ao salvar lead:", error.message, error.details, error.hint);
        return null;
    }

    return voucherCode;
};
