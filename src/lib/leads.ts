import { supabase } from './supabase';

export async function saveCheckoutLead(name: string, whatsapp: string, items: any[]) {
  try {
    const { error } = await supabase
      .from('leads')
      .insert([
        {
          client_name: name,
          whatsapp,
          interest_type: 'checkout_abandonment',
          description: `Produtos não carrinho: ${items.map(i => i.product.name).join(', ')}`,
          status: 'pending'
        }
      ]);

    if (error) throw error;
    console.log('[LEADS] Lead de checkout salvo com sucesso!');
  } catch (error) {
    console.error('[LEADS] Erro ao salvar lead:', error);
  }
}

export async function trackLead(data: any) {
  try {
    const voucherCode = `BPC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    const { error } = await supabase
      .from('leads')
      .insert([
        {
          client_name: data.client_name,
          whatsapp: data.whatsapp,
          interest_type: data.interest_type,
          intent_type: data.intent_type,
          description: data.description,
          status: 'pending',
          voucher_code: data.voucher_code || voucherCode,
          marketing_source: data.marketing_source || 'direct',
          utm_parameters: data.utm_parameters || {}
        }
      ]);

    if (error) throw error;
    console.log('[LEADS] Lead geral capturado com sucesso!');
    return data.voucher_code || voucherCode;
  } catch (error) {
    console.error('[LEADS] Erro ao rastrear lead:', error);
    return null;
  }
}
