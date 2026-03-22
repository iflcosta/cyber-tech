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
    const voucherCode = data.voucher_code || `BPC-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Convert undefined to null for explicitly omitting fields during upsert
    const cleanData = {
      client_name: data.client_name || null,
      whatsapp: data.whatsapp || null,
      interest_type: data.interest_type || null,
      intent_type: data.intent_type || null,
      description: data.description || null,
      status: data.status || 'pending',
      voucher_code: voucherCode,
      marketing_source: data.marketing_source || null,
      utm_parameters: data.utm_parameters || null
    };

    // Remove keys that are strictly null to allow Supabase defaults or avoid overriding existing data with null
    Object.keys(cleanData).forEach(key => {
        if ((cleanData as any)[key] === null) {
            delete (cleanData as any)[key];
        }
    });

    const { error } = await supabase
      .from('leads')
      .insert(cleanData);

    if (error) throw error;
    console.log('[LEADS] Lead geral atualizado/capturado com sucesso! Voucher:', voucherCode);
    return voucherCode;
  } catch (error) {
    console.error('[LEADS] Erro ao rastrear lead:', error);
    return null;
  }
}
