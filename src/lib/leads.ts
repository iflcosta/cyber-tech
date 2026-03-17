import { supabase } from './supabase';

export async function saveCheckoutLead(name: string, whatsapp: string, items: any[]) {
  try {
    const { error } = await supabase
      .from('leads')
      .insert([
        {
          name,
          whatsapp,
          source: 'checkout_abandonment',
          notes: `Produtos no carrinho: ${items.map(i => i.product.name).join(', ')}`,
          status: 'new'
        }
      ]);

    if (error) throw error;
    console.log('[LEADS] Lead de checkout salvo com sucesso!');
  } catch (error) {
    console.error('[LEADS] Erro ao salvar lead:', error);
  }
}
