import { supabase } from './supabase';

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
