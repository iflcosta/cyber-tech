import { supabase } from './supabase';
import { createTinyOrder } from './tiny';

// Detecta a origem do lead via UTM params ou referrer e retorna detalhes completos
function detectMarketingSource() {
    const details = {
        source: 'direto',
        campaign: '',
        utm_params: {} as Record<string, string>
    };

    if (typeof window === 'undefined') return details;

    const params = new URLSearchParams(window.location.search);
    
    // Captura todos os UTMs
    params.forEach((value, key) => {
        if (key.startsWith('utm_')) {
            details.utm_params[key] = value;
        }
    });

    const utmSource = params.get('utm_source');
    const utmCampaign = params.get('utm_campaign');
    
    if (utmCampaign) details.campaign = utmCampaign;

    if (utmSource) {
        const src = utmSource.toLowerCase();
        if (src.includes('instagram') || src.includes('ig')) details.source = 'instagram';
        else if (src.includes('facebook') || src.includes('fb')) details.source = 'facebook';
        else if (src.includes('google') || src.includes('gads')) details.source = 'google_ads';
        else if (src.includes('whatsapp') || src.includes('wpp')) details.source = 'whatsapp';
        else if (src.includes('tiktok')) details.source = 'tiktok';
        else details.source = utmSource;
        
        return details;
    }

    const referrer = document.referrer;
    if (!referrer) return details;
    
    if (referrer.includes('instagram.com')) details.source = 'instagram';
    else if (referrer.includes('facebook.com')) details.source = 'facebook';
    else if (referrer.includes('google.com')) details.source = 'google_organico';
    else if (referrer.includes('whatsapp.com')) details.source = 'whatsapp';
    else if (referrer.includes('tiktok.com')) details.source = 'tiktok';
    else details.source = 'outros';

    return details;
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

    // Detecta a origem de marketing detalhada
    const marketingData = detectMarketingSource();

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
        marketing_source: marketingData.source,
        campaign_name: marketingData.campaign,
        utm_parameters: marketingData.utm_params
    });

    if (error) {
        console.error("Erro detalhado ao salvar lead:", error.message, error.details, error.hint);
        return null;
    }

    return voucherCode;
};
